import { useParams, Link } from "react-router-dom"
import { ArrowLeft, View, HelpCircle, Zap, Smartphone, Info, Camera, CameraOff, RefreshCcw, Download, Sliders, Move, RotateCw, Maximize2, AlertCircle, CheckCircle, CheckCircle2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"
import { useTranslation } from 'react-i18next'
import { QRCodeCanvas } from "qrcode.react"

function ARView() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [arSupported, setArSupported] = useState(true) 
  const [showWebcam, setShowWebcam] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [modelError, setModelError] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [exposure, setExposure] = useState(1.2)
  const [shadowIntensity, setShadowIntensity] = useState(2)
  const [captureStatus, setCaptureSuccess] = useState(false)
  const modelViewerRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const containerRef = useRef(null)
  const { t } = useTranslation()

  // Handle model loading error
  const onModelError = (event) => {
    console.error("Model Viewer Error:", event);
    setModelError(true);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productRef = doc(db, "products", id)
        const productSnap = await getDoc(productRef)
        
        if (productSnap.exists()) {
          setProduct({ _id: productSnap.id, ...productSnap.data() })
        }
      } catch (err) {
        console.error("Failed to fetch product from Firestore for AR view:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  // Check for AR support when component mounts
  useEffect(() => {
    if (modelViewerRef.current) {
      const timer = setTimeout(() => {
        const canAR = modelViewerRef.current.canActivateAR
        setArSupported(!!canAR)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  const toggleWebcam = async () => {
    if (showWebcam) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      setShowWebcam(false)
      setCameraError(null)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          setShowWebcam(true)
          setCameraError(null)
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
        setCameraError(t('ar.camera_error', { defaultValue: "Camera access denied or not available. Please check your browser permissions." }))
      }
    }
  }

  const captureWorkspace = () => {
    if (!containerRef.current) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = videoRef.current;
    const modelViewer = modelViewerRef.current;

    if (!video || !modelViewer) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 1. Draw video background (mirrored)
    context.save();
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    context.restore();

    // 2. Draw model-viewer content
    // Note: model-viewer toBlob() is async
    modelViewer.toBlob().then(blob => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // 3. Download the final image
          const link = document.createElement('a');
          link.download = `my-workspace-${product.name}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          // Show Success Message
          setCaptureSuccess(true);
          setTimeout(() => setCaptureSuccess(false), 3000);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(blob);
    });
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleARClick = () => {
    if (modelViewerRef.current) {
      if (arSupported) {
        modelViewerRef.current.activateAR()
      } else {
        toggleWebcam()
      }
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-16 h-16 border-4 border-slate-700 border-t-primary rounded-full animate-spin mb-6"></div>
      <p className="font-black uppercase tracking-widest text-xs">{t('ar.loading', { defaultValue: 'Initializing 3D Space...' })}</p>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
      <AlertCircle className="text-red-500 mb-6" size={48} />
      <h2 className="text-4xl font-black mb-6 tracking-tighter leading-none uppercase">{t('product.not_found', { defaultValue: 'Product Not Found' })}</h2>
      <Link to="/catalog" className="btn-primary inline-flex px-12 h-16 shadow-glow">
        {t('product.return', { defaultValue: 'Back to Catalog' })}
      </Link>
    </div>
  )

  const isSketchfab = product?.arModel?.includes('sketchfab.com')

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col">
      <div className="container mx-auto px-6 py-8 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/product/${id}`} className="inline-flex items-center gap-3 text-slate-400 hover:text-white transition-all group">
            <div className="p-2 bg-white/5 rounded-xl group-hover:-translate-x-1 transition-transform">
              <ArrowLeft size={20} />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs">{t('ar.exit', { defaultValue: 'Exit 3D View' })}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className={`text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2 border tracking-widest uppercase transition-all ${showWebcam ? 'bg-emerald-500 text-white border-emerald-400 shadow-glow' : 'bg-primary/20 text-primary border-primary/20'}`}>
              {showWebcam ? <Camera size={14} /> : <View size={14} />}
              {showWebcam ? t('ar.workspace_active', { defaultValue: 'Workspace View Active' }) : (isSketchfab ? t('ar.interactive', { defaultValue: 'Interactive 3D' }) : t('ar.active', { defaultValue: 'AR Mode Active' }))}
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-grow rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative bg-black/40 backdrop-blur-3xl group">
          {product?.arModel ? (
            isSketchfab ? (
              <div className="w-full h-full">
                <iframe 
                  title={product.name}
                  className="w-full h-full border-0"
                  allowFullScreen 
                  mozallowfullscreen="true" 
                  webkitallowfullscreen="true" 
                  allow="autoplay; fullscreen; xr-spatial-tracking" 
                  xr-spatial-tracking="true"
                  execution-while-out-of-viewport="true"
                  execution-while-not-rendered="true" 
                  web-share="true" 
                  src={product.arModel}
                ></iframe>
              </div>
            ) : (
              <div className="w-full h-full relative">
                {/* Webcam Layer */}
                {showWebcam && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                )}

                <model-viewer
                  ref={modelViewerRef}
                  src={product.arModel}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  poster={showWebcam ? "" : product.image}
                  shadow-intensity={shadowIntensity}
                  shadow-softness="1"
                  environment-image="neutral"
                  auto-rotate={!showWebcam} 
                  exposure={exposure}
                  interaction-prompt="auto"
                  loading="eager"
                  reveal="auto"
                  bounds="tight"
                  enable-pan
                  camera-orbit="auto auto auto"
                  min-camera-orbit="auto auto auto"
                  max-camera-orbit="auto auto auto"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    minHeight: '600px', 
                    backgroundColor: 'transparent',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 20,
                    "--poster-color": "transparent"
                  }}
                  className="model-viewer-ar"
                  onError={onModelError}
                >
                  <div slot="progress-bar" className="absolute top-0 left-0 w-full h-1.5 bg-white/10 z-50">
                    <div className="bg-primary h-full rounded-r-full transition-all duration-300" style={{ width: 'var(--progress-bar-width, 0%)' }}></div>
                  </div>

                  {modelError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md z-[60] text-center p-8">
                      <AlertCircle className="text-red-500 mb-6 animate-pulse" size={48} />
                      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">
                        {t('ar.load_error', { defaultValue: 'Model Load Failed' })}
                      </h3>
                      <p className="text-slate-400 text-sm mb-8 font-medium max-w-xs">
                        {t('ar.load_error_desc', { defaultValue: `Unable to load 3D file.` })}
                        <br />
                        <span className="text-[10px] text-red-400 font-mono mt-2 block bg-black/20 p-2 rounded">
                          Path: {product.arModel || "Not Found in DB"}
                        </span>
                      </p>
                      <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button 
                          onClick={() => window.location.reload()}
                          className="btn-primary h-14 w-full shadow-glow"
                        >
                          <RefreshCcw size={18} />
                          {t('ar.retry', { defaultValue: 'Retry Load' })}
                        </button>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-4">
                          Tip: Ensure you have clicked 'Seed Products' to sync paths.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Workspace Controls Overlay */}
                  {showWebcam && (
                    <div className="absolute top-0 right-0 h-full p-8 z-30 pointer-events-none">
                      <div className="flex flex-col gap-6 h-full pointer-events-auto animate-in slide-in-from-right-8 duration-500">
                        {/* Control Panel */}
                        <div className="glass-modern dark:bg-slate-900/80 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl w-72 overflow-y-auto max-h-[70vh]">
                          <div className="flex items-center gap-3 mb-8 text-primary">
                            <Sliders size={20} />
                            <h3 className="text-sm font-black uppercase tracking-widest">{t('ar.controls', { defaultValue: 'Placement' })}</h3>
                          </div>
                          
                          <div className="space-y-10">
                            <div>
                              <div className="flex justify-between mb-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Maximize2 size={12} /> {t('ar.scale', { defaultValue: 'Size' })}
                                </label>
                                <span className="text-[10px] font-black text-primary">{Math.round(scale * 100)}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0.1" 
                                max="3" 
                                step="0.1" 
                                value={scale}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setScale(val);
                                  if (modelViewerRef.current) {
                                    modelViewerRef.current.scale = `${val} ${val} ${val}`;
                                  }
                                }}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between mb-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <RotateCw size={12} /> {t('ar.rotate', { defaultValue: 'Rotation' })}
                                </label>
                                <span className="text-[10px] font-black text-primary">{rotation}°</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                step="1" 
                                value={rotation}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setRotation(val);
                                  if (modelViewerRef.current) {
                                    modelViewerRef.current.cameraOrbit = `${val}deg 75deg auto`;
                                  }
                                }}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer"
                              />
                            </div>

                            <div className="pt-6 border-t border-white/5">
                              <div className="flex justify-between mb-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Zap size={12} /> {t('ar.exposure', { defaultValue: 'Brightness' })}
                                </label>
                                <span className="text-[10px] font-black text-primary">{Math.round(exposure * 10) / 10}</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="2" 
                                step="0.1" 
                                value={exposure}
                                onChange={(e) => setExposure(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between mb-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Move size={12} /> {t('ar.shadow', { defaultValue: 'Shadow' })}
                                </label>
                                <span className="text-[10px] font-black text-primary">{Math.round(shadowIntensity * 10) / 10}</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                step="1" 
                                value={shadowIntensity}
                                onChange={(e) => setShadowIntensity(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="mt-12 space-y-4">
                            <button 
                              onClick={captureWorkspace}
                              className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow flex items-center justify-center gap-3 hover:scale-105 transition-all"
                            >
                              <Download size={16} />
                              {t('ar.capture', { defaultValue: 'Capture View' })}
                            </button>
                            <button 
                              onClick={() => {
                                setScale(1);
                                setRotation(0);
                                setExposure(1.2);
                                setShadowIntensity(2);
                                if (modelViewerRef.current) {
                                  modelViewerRef.current.scale = "1 1 1";
                                  modelViewerRef.current.cameraOrbit = "auto auto auto";
                                }
                              }}
                              className="w-full py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                            >
                              <RefreshCcw size={16} />
                              {t('ar.reset', { defaultValue: 'Reset Setup' })}
                            </button>
                          </div>
                        </div>

                        {/* Hint */}
                        <div className="glass-modern dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 text-emerald-500 mt-auto">
                          <div className="flex items-center gap-3">
                            <Move size={18} />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                              {t('ar.drag_hint', { defaultValue: 'Drag to position model' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 w-full px-6">
                      {captureStatus ? (
                        <div className="bg-emerald-500 text-white px-10 py-5 rounded-2xl shadow-glow animate-in zoom-in duration-300 flex items-center gap-3 font-black uppercase tracking-widest text-xs">
                          <CheckCircle2 size={20} />
                          {t('ar.workspace_captured', { defaultValue: 'Workspace Captured!' })}
                        </div>
                      ) : (
                        <button 
                          onClick={handleARClick}
                          className={`flex items-center gap-3 px-10 py-5 rounded-2xl shadow-glow hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-xs whitespace-nowrap ${showWebcam ? 'bg-red-500 text-white shadow-none' : 'bg-primary text-white'}`}
                        >
                          {showWebcam ? <CameraOff size={20} /> : <Zap size={20} className="fill-white" />}
                          {showWebcam ? t('ar.close_workspace', { defaultValue: 'Close Workspace View' }) : (arSupported ? t('ar.view_in_space', { defaultValue: 'View in your space' }) : t('ar.open_workspace', { defaultValue: 'Open Workspace View' }))}
                        </button>
                      )}
                    
                    {cameraError && (
                      <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-200 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        <Info size={14} />
                        {cameraError}
                      </div>
                    )}
                  </div>

                  {/* Interaction Label */}
                  {!showWebcam && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-20">
                      <View size={20} className="text-primary" />
                      <span className="font-bold text-sm text-white">{t('ar.interaction', { defaultValue: 'Realistic 3D Interaction' })}</span>
                    </div>
                  )}
                </model-viewer>
                
                {/* Desktop Hint */}
                {!arSupported && !showWebcam && (
                  <div className="absolute bottom-24 right-10 hidden lg:flex flex-col items-center gap-4 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 max-w-xs text-center shadow-2xl z-20">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                      <Smartphone size={32} />
                    </div>
                    <h4 className="text-white font-black text-lg tracking-tight leading-none uppercase">{t('ar.desktop_title', { defaultValue: 'Try on Mobile' })}</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      {t('ar.desktop_desc', { defaultValue: 'Scan this product on your phone for full AR floor detection and realistic placement.' })}
                    </p>
                    <div className="bg-white rounded-2xl p-4 mt-2 shadow-inner">
                      <QRCodeCanvas 
                        value={window.location.href} 
                        size={128}
                        level={"H"}
                        includeMargin={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                <Zap size={48} className="text-primary animate-pulse" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase text-white leading-none">{t('ar.pending_title', { defaultValue: '3D Model In Progress' })}</h2>
              <p className="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed mt-4">
                {t('ar.pending_desc', { defaultValue: 'We are currently digitizing this component for high-fidelity 3D viewing. Please check back soon.' })}
              </p>
              <Link to={`/product/${id}`} className="mt-12 btn-primary inline-flex px-12 h-16">
                {t('ar.return', { defaultValue: 'Return to Marketplace' })}
              </Link>
            </div>
          )}
        </div>
        
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 mt-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-tight leading-none mb-1">{product?.name}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{product?.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            {showWebcam && (
              <button 
                onClick={toggleWebcam}
                className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 hover:text-red-400 transition-colors"
              >
                <CameraOff size={14} />
                {t('ar.disable_camera', { defaultValue: 'Disable Camera' })}
              </button>
            )}
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <View size={14} />
              {t('ar.powered_by', { defaultValue: 'Powered by' })} {isSketchfab ? 'Sketchfab 3D' : 'WebXR Technology'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ARView
