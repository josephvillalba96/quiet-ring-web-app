// import {
//   StreamVideo,
//   StreamVideoClient,
//   Call,
//   StreamCall,
//   SpeakerLayout,
//   CallingState,
//   useCallStateHooks,
//   StreamTheme,
// } from '@stream-io/video-react-sdk';
// import type { User } from '@stream-io/video-react-sdk';
// import '@stream-io/video-react-sdk/dist/css/styles.css';
// import { useState, useEffect } from 'react';
// import { generateJWT } from '../utils/jwtGenerator'; 

// const apiKey = '4xxjd62er5sz';
// const secret = 'e4mtbmwa2vcz7x37k83uuwr86zguwtm73pnv556sk4yp4mmaq8drt9wgxjgjykbk';
// const userId = 'caller';
// const user: User = { id: userId };



// // Componente para la interfaz de llamada activa
// const LiveCallPanel = ({ call, endCall }: { call: Call; endCall: () => void }) => {
//   const { useCallCallingState } = useCallStateHooks();
//   const callingState = useCallCallingState();

//   if (callingState !== CallingState.JOINED) {
//     return <div>Conectando...</div>;
//   }

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
//       <StreamCall call={call}>
//         <SpeakerLayout />
//       </StreamCall>
//       <button onClick={endCall} style={{ marginTop: '10px' }}>
//         Finalizar llamada
//       </button>
//     </div>
//   );
// };

// export default function App() {
//   const [call, setCall] = useState<Call | null>(null);
//   const [callId, setCallId] = useState<string>('meeting-123');
//   const [isTokenReady, setIsTokenReady] = useState<boolean>(false);
//   const [client, setClient] = useState<StreamVideoClient | null>(null);

//   // Initialize client when component mounts
//   useEffect(() => {
//     generateJWT(apiKey, secret, userId).then(jwtToken => {
//       const newClient = new StreamVideoClient({ apiKey, user, token: jwtToken });
//       setClient(newClient);
//       setIsTokenReady(true);
//     });
//   }, []);

//   const startCall = async () => {
//     if (!client || !isTokenReady) {
//       console.error('Cliente no está listo aún');
//       return;
//     }

//     const newCall = client.call('default', callId);
//     try {
//       await newCall.join({ create: true });
//       setCall(newCall);
//     } catch (err) {
//       console.error('Error al unirse a la llamada:', err);
//     }
//   };

//   const endCall = async () => {
//     if (call) {
//       try {
//         await call.leave();
//       } catch (err) {
//         console.error('Error al salir:', err);
//       } finally {
//         setCall(null);
//       }
//     }
//   };

//   return (
//     <StreamVideo client={client!}>
//       <StreamTheme>
//         <div style={{ padding: '20px' }}>
//           <h1>📞 Caller App</h1>
//           {!call ? (
//             <div>
//               <input
//                 type="text"
//                 value={callId}
//                 onChange={(e) => setCallId(e.target.value)}
//                 placeholder="Call ID"
//                 style={{ marginRight: '10px' }}
//               />
//               <button onClick={startCall} disabled={!isTokenReady}>
//                 {isTokenReady ? 'Start Call' : 'Loading...'}
//               </button>
//             </div>
//           ) : (
//             <LiveCallPanel call={call} endCall={endCall} />
//           )}
//         </div>
//       </StreamTheme>
//     </StreamVideo>
//   );
// }

import {
  StreamVideo,
  StreamVideoClient,
  Call,
  StreamCall,
  SpeakerLayout,
  CallingState,
  StreamTheme,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import type { User } from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

import { useState, useEffect, useRef } from 'react';
import { generateJWT } from '../utils/jwtGenerator';


// =============== CONFIG ===============
const apiKey = '4xxjd62er5sz';
const secret = 'e4mtbmwa2vcz7x37k83uuwr86zguwtm73pnv556sk4yp4mmaq8drt9wgxjgjykbk';
const userId = 'caller';

const user: User = { id: userId };
// =====================================



// =====================================
// UI DE LLAMADA
// =====================================
const CallUI = ({ call, endCall }: { call: Call; endCall: () => void }) => {
  const { useCallCallingState } = useCallStateHooks();
  const state = useCallCallingState();

  return (
    <div style={{ height: '80vh' }}>
      {state !== CallingState.JOINED ? (
        <p>Conectando...</p>
      ) : (
        <SpeakerLayout />
      )}

      <button onClick={endCall}>Colgar</button>
    </div>
  );
};



// =====================================
// APP PRINCIPAL
// =====================================
export default function CallerApp() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [ready, setReady] = useState(false);

  const initRef = useRef(false);

  const callId = 'meeting-demo'; // fijo para pruebas



  // ------------------------------
  // INICIALIZAR CLIENTE
  // ------------------------------
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      const token = await generateJWT(apiKey, secret, userId);

      const videoClient =
        StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          token,
        });

      await videoClient.connectUser(user, token);

      console.log('✅ Cliente conectado como caller');

      setClient(videoClient);
      setReady(true);

      await navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .catch(() => { });
    };

    init();

    return () => {
      client?.disconnectUser();
    };
  }, []);




  // ------------------------------
  // INICIAR LLAMADA
  // ------------------------------
  const startCall = async () => {
    if (!client) return;

    try {
      const newCall = client.call('default', callId);

      await newCall.getOrCreate({
        data: {
          members: [
            { user_id: 'caller' },
            { user_id: '3246513976-5785369ebaa940d2a6901823d421b722' },
          ],
          created_by_id: 'caller',
        },
        ring: true,
      });

      // 🔎 DIAGNÓSTICO REAL
      const members = await newCall.queryMembers({});
      console.log('👥 Miembros de la llamada:', members);

      await newCall.join();

      setCall(newCall);

    } catch (err) {
      console.error('❌ Error iniciando llamada:', err);
    }
  };




  // ------------------------------
  // COLGAR
  // ------------------------------
  const endCall = async () => {
    await call?.leave();
    setCall(null);
  };




  // =============================
  // RENDER
  // =============================
  if (!client) return <p>Inicializando...</p>;

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        <h1>📞 Caller</h1>

        {!call ? (
          <button onClick={startCall} disabled={!ready}>
            Llamar a callee
          </button>
        ) : (
          <StreamCall call={call}>
            <CallUI call={call} endCall={endCall} />
          </StreamCall>
        )}
      </StreamTheme>
    </StreamVideo>
  );
}
