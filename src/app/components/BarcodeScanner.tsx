"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from "@zxing/library";
import { FiCamera, FiX, FiRotateCcw, FiSearch } from "react-icons/fi";
import styles from "./BarcodeScanner.module.css";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onBarcodeScanned }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      setHasPermission(true);

      // Initialize barcode reader
      codeReader.current = new BrowserMultiFormatReader();
      
      // Get available video devices
      const videoInputDevices = await codeReader.current.listVideoInputDevices();
      setDevices(videoInputDevices);
      
      if (videoInputDevices.length > 0) {
        // Prefer back camera on mobile
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        const deviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
        setSelectedDevice(deviceId);
        startScanning(deviceId);
      } else {
        setError("No camera devices found");
      }
    } catch (err) {
      console.error("Camera initialization error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access and try again.");
          setHasPermission(false);
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Failed to initialize camera. Please check your browser settings.");
        }
      }
    }
  };

  const startScanning = async (deviceId?: string) => {
    if (!codeReader.current || !videoRef.current) return;

    setIsScanning(true);
    setError(null);

    try {
      const selectedDeviceId = deviceId || selectedDevice;
      
      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            console.log("Barcode detected:", barcode);
            onBarcodeScanned(barcode);
            stopScanning();
            onClose();
          }
          
          if (error && !(error instanceof NotFoundException)) {
            // Only log non-NotFoundException errors
            if (!(error instanceof ChecksumException) && !(error instanceof FormatException)) {
              console.error("Scanning error:", error);
            }
          }
        }
      );
    } catch (err) {
      console.error("Scanning start error:", err);
      setError("Failed to start scanning. Please try again.");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    
    stopScanning();
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDevice(nextDeviceId);
    await startScanning(nextDeviceId);
  };

  const retryPermission = async () => {
    setError(null);
    setHasPermission(null);
    await initializeScanner();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.scannerOverlay}>
      <div className={styles.scanner}>
        {/* Header */}
        <div className={styles.header}>
          <h3>Scan Vinyl Barcode</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        {/* Scanner Content */}
        <div className={styles.scannerContent}>
          {hasPermission === false ? (
            <div className={styles.permissionError}>
              <FiCamera size={48} />
              <h4>Camera Permission Required</h4>
              <p>Please allow camera access to scan barcodes</p>
              <button onClick={retryPermission} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <FiSearch size={48} />
              <h4>Scanner Error</h4>
              <p>{error}</p>
              <button onClick={retryPermission} className={styles.retryButton}>
                <FiRotateCcw size={16} />
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className={styles.videoContainer}>
                <video
                  ref={videoRef}
                  className={styles.video}
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                <div className={styles.scanningOverlay}>
                  <div className={styles.scanningFrame}>
                    <div className={styles.corner} />
                    <div className={styles.corner} />
                    <div className={styles.corner} />
                    <div className={styles.corner} />
                  </div>
                  <div className={styles.scanningLine} />
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                  {devices.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className={styles.controlButton}
                      disabled={!isScanning}
                    >
                      <FiRotateCcw size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.instructions}>
                <p>Position the barcode within the frame</p>
                <p>The scanner will automatically detect and scan the barcode</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}