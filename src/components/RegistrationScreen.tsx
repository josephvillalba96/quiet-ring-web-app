import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  UserIcon,
  SparklesIcon
} from
  'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PublicDoorbellService } from '../services/PublicDoorbellService';

interface RegistrationScreenProps {
  onContinue: () => void;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28
};

// Helper to convert dataURI to Blob
function dataURItoBlob(dataURI: string) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// Helper to generate random MAC (now handled in context)


export function RegistrationScreen({ onContinue }: RegistrationScreenProps) {
  const [name, setName] = useState('');
  const [captured, setCaptured] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const {
    updateName,
    completeProfile,
    isAuthenticated
  } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [searchParams] = useSearchParams();
  const ringCode = searchParams.get('ring');

  const canContinue = name.trim().length >= 2 && captured && !isRegistering && isAuthenticated;

  // Get ring code from URL and fetch doorbell info
  useEffect(() => {
    if (ringCode) {
      // Use the ring code as the callId
      console.log('🔔 Ring code detected from URL:', ringCode);

      // Fetch doorbell info
      PublicDoorbellService.getDoorbellInfo(ringCode)
        .then((response) => {
          console.log('✅ Doorbell info response:', response);
        })
        .catch((error) => {
          console.error('❌ Failed to fetch doorbell info:', error);
        });
    } else {
      console.warn('⚠️ No ring code found in URL');
    }
  }, [ringCode]);

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      setCaptured(true);
    }
  }, [webcamRef]);

  const handleRetake = () => {
    setCaptured(false);
    setImgSrc(null);
  };

  const handleContinue = async () => {
    if (!name.trim() || !captured || !imgSrc) return;

    setIsRegistering(true);
    try {
      // 1. Update name and capture state in context
      updateName(name.trim());

      // 2. Complete Profile (Upload + Registry via Legacy)
      // The session token and sessionId are already in context due to mount-time startSession
      const blob = dataURItoBlob(imgSrc);
      await completeProfile(blob);

      console.log('Registration and profile update complete');

      // Proceed to Lobby (App.tsx will handle navigation)
      onContinue();
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register. Please try again.');
      setIsRegistering(false);
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 60
      }}
      animate={{
        opacity: 1,
        x: 0
      }}
      exit={{
        opacity: 0,
        x: -60
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      className="min-h-screen w-full relative overflow-y-auto"
      style={{
        background:
          'linear-gradient(160deg, #fdfcfb 0%, #fff7ed 30%, #fef3ec 60%, #f5f0ff 100%)'
      }}>

      {/* Decorative background orbs */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(234,89,45,0.08) 0%, transparent 70%)',
          top: '-10%',
          right: '-8%'
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }} />

      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(51,66,149,0.06) 0%, transparent 70%)',
          bottom: '-5%',
          left: '-5%'
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }} />


      {/* Thin accent line at very top */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background: 'linear-gradient(90deg, #EA592D, #7c3aed, #334295)'
        }} />


      {/* Main content — two-column on desktop, stacked on mobile */}
      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center px-6 sm:px-10 md:px-16 lg:px-24 py-12 md:py-0 gap-10 md:gap-16 lg:gap-24">
        {/* LEFT — Camera Preview (hero element) */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
            rotateY: 8
          }}
          animate={{
            opacity: 1,
            y: 0,
            rotateY: -2
          }}
          transition={{
            delay: 0.15,
            type: 'spring',
            stiffness: 200,
            damping: 25
          }}
          className="w-full md:w-[35%] lg:w-[38%] flex-shrink-0 flex flex-col items-center justify-center md:min-h-screen md:py-16"
          style={{
            perspective: 1200
          }}>

          <div
            className="relative w-full max-w-sm md:max-w-none aspect-[4/5] sm:aspect-[4/5] md:aspect-[3/4] rounded-3xl overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow:
                '0 30px 80px -20px rgba(234,89,45,0.18), 0 15px 40px -10px rgba(0,0,0,0.08)'
            }}>

            {captured ?
              <motion.div
                initial={{
                  scale: 1.1,
                  opacity: 0
                }}
                animate={{
                  scale: 1,
                  opacity: 1
                }}
                transition={springTransition}
                className="w-full h-full bg-gray-900 flex items-center justify-center relative">

                {/* Display captured image */}
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt="Captured avatar"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                <div className="text-center relative z-10">
                  <motion.div
                    initial={{
                      scale: 0
                    }}
                    animate={{
                      scale: 1
                    }}
                    transition={{
                      delay: 0.1,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue mx-auto mb-4 flex items-center justify-center shadow-lg">

                    <UserIcon className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.p
                    initial={{
                      opacity: 0,
                      y: 8
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    transition={{
                      delay: 0.25
                    }}
                    className="text-white text-sm font-sora font-medium drop-shadow-md mb-6">

                    Looking great ✓
                  </motion.p>
                </div>
              </motion.div> :

              /* Remove gradient-mesh and ensure neutral background */
              <div className="w-full h-full flex items-center justify-center relative bg-black">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "user",
                    width: 720,
                    height: 1280
                  }}
                  mirrored={true}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            }

            {/* Capture button — overlaid on camera */}
            {!captured &&
              <motion.button
                initial={{
                  y: 20,
                  opacity: 0
                }}
                animate={{
                  y: 0,
                  opacity: 1
                }}
                transition={{
                  delay: 0.4,
                  ...springTransition
                }}
                whileTap={{
                  scale: 0.88
                }}
                onClick={handleCapture}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-sora font-medium backdrop-blur-md z-20"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 8px 24px -4px rgba(0,0,0,0.2)'
                }}
                aria-label="Capture photo">

                <div className="w-4 h-4 rounded-full border-2 border-white" />
                Capture
              </motion.button>
            }

            {/* Captured badge */}
            {captured &&
              <motion.div
                initial={{
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  scale: 1,
                  opacity: 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 25
                }}
                className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sora font-semibold text-white backdrop-blur-md z-20"
                style={{
                  background: 'rgba(234,89,45,0.7)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>

                <SparklesIcon className="w-3 h-3" />
                Ready
              </motion.div>
            }
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mt-8"
            style={{
              display: captured ? 'flex' : 'none'
            }}
          >
            <button
              onClick={handleRetake}
              disabled={isRegistering}
              className="px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-md text-gray-700 font-sora text-sm font-semibold hover:bg-white/90 transition-all border border-white/40 shadow-sm disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={handleContinue}
              disabled={isRegistering}
              className="px-8 py-3 rounded-2xl text-white font-sora text-sm font-semibold shadow-xl shadow-orange-500/20 hover:scale-105 transition-all transform flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #EA592D 0%, #FF6B4A 100%)'
              }}
            >
              {isRegistering ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Processing...
                </>
              ) : (
                'Use photo'
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* RIGHT — Form content */}
        <div className="w-full md:w-[58%] lg:w-[52%] flex flex-col justify-center md:min-h-screen md:py-16">
          {/* Heading — editorial, left-aligned */}
          <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.2,
              ...springTransition
            }}
            className="mb-10">

            <p
              className="text-sm font-sora font-semibold tracking-wide uppercase mb-3"
              style={{
                background: 'linear-gradient(135deg, #EA592D, #334295)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>

              Get started
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 font-sora leading-[1.1] tracking-tight">
              Join the
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(135deg, #EA592D 0%, #FF6B4A 50%, #334295 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>

                conversation
              </span>
            </h1>
            <p className="text-gray-500 font-sora text-base mt-4 max-w-sm leading-relaxed">
              Set up your profile and you'll be connected in seconds.
            </p>
          </motion.div>

          {/* Name Input — glassmorphic, standalone */}
          <motion.div
            initial={{
              y: 16,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.3,
              ...springTransition
            }}
            className="mb-8">

            <label
              htmlFor="name-input"
              className={`block text-xs font-semibold uppercase tracking-wider mb-3 font-sora ${captured ? 'text-gray-500' : 'text-gray-400'}`}>

              Your name {captured ? '' : '(Take photo first)'}
            </label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={isRegistering || !captured}
              placeholder={captured ? "Enter your name" : "Take a photo first"}
              className="w-full max-w-sm px-5 py-4 rounded-2xl text-gray-900 placeholder-gray-400 font-sora text-base outline-none transition-all duration-300 disabled:opacity-50"
              style={{
                background: inputFocused ?
                  'rgba(255,255,255,0.9)' :
                  'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: inputFocused ?
                  '2px solid #EA592D' :
                  '2px solid rgba(234,89,45,0.15)',
                boxShadow: inputFocused ?
                  '0 8px 32px -8px rgba(234,89,45,0.2), 0 0 0 4px rgba(234,89,45,0.06)' :
                  '0 4px 16px -4px rgba(0,0,0,0.04)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleContinue();
              }} />

          </motion.div>

          {/* Continue Button — bold, standalone */}
          <motion.div
            initial={{
              y: 16,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.4,
              ...springTransition
            }}>

            <motion.button
              whileTap={
                canContinue ?
                  {
                    scale: 0.96
                  } :
                  undefined
              }
              onClick={handleContinue}
              disabled={!canContinue}
              className={`group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-sora font-semibold text-base transition-all duration-300 ${canContinue ? 'cursor-pointer' : 'cursor-not-allowed opacity-35'}`}
              style={{
                background: 'linear-gradient(135deg, #EA592D 0%, #FF6B4A 100%)',
                boxShadow: canContinue ?
                  '0 8px 32px -8px rgba(234,89,45,0.5), 0 2px 8px -2px rgba(234,89,45,0.3)' :
                  'none'
              }}
              aria-label="Continue to lobby">

              {isRegistering ? 'Processing...' : 'Continue'}
              {!isRegistering && (
                <motion.span
                  animate={
                    canContinue ?
                      {
                        x: [0, 4, 0]
                      } :
                      {
                        x: 0
                      }
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}>

                  <ArrowRightIcon className="w-5 h-5" />
                </motion.span>
              )}
            </motion.button>
          </motion.div>

          {/* Subtle footer hint */}
          <motion.p
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 0.6
            }}
            className="text-gray-400 text-xs font-sora mt-8">

            Your camera is used only for the call preview.
          </motion.p>
        </div>
      </div >
    </motion.div >);
}