# Investigación: Componente Lobby de GetStream

## 1. ¿Qué es el Lobby?
El "Lobby" o "Sala de Espera" es una pantalla intermedia donde los usuarios pueden certificar que su configuración de audio y video es correcta antes de unirse a una llamada activa. Es una práctica estándar en aplicaciones de videoconferencia (como Google Meet o Zoom).

En el SDK de **GetStream Video para React (Web)**, no existe un componente monolítico único llamado `<Lobby />` (a diferencia de React Native). En su lugar, el SDK proporciona **primitivas y componentes UI** que nos permiten construir un Lobby totalmente personalizado y funcional.

## 2. Componentes Clave para Construir el Lobby
Para implementar un Lobby, utilizaremos los siguientes componentes del SDK:

*   **`<VideoPreview />`**: Muestra el feed de video local del usuario. Es el componente central visualmente.
*   **`useCallStateHooks`**: Hooks para verificar el estado de la llamada y los permisos.
*   **Gestión de Dispositivos**:
    *   `call.camera.listDevices()` / `call.microphone.listDevices()`: Para listar dispositivos disponibles.
    *   `call.camera.select()` / `call.microphone.select()`: Para cambiar de dispositivo.
*   **Controles de Mute/Unmute**: Métodos `call.camera.toggle()` y `call.microphone.toggle()`.

## 3. Estrategia de Integración

### Paso 1: Crear el Componente `Lobby`
Crearemos un nuevo componente en `src/features/call/components/Lobby.tsx` que encapsule esta lógica.

**Responsabilidades del Componente:**
1.  Inicializar la cámara y micrófono (si no están ya activos).
2.  Mostrar el `<VideoPreview />`.
3.  Mostrar selectores para cambiar cámara/micrófono (opcional en V1, pero recomendado).
4.  Botón "Unirse" que ejecute `call.join()`.

### Paso 2: Modificar `CallView`
Actualmente, `CallView` intenta unirse a la llamada inmediatamente o muestra un botón básico. Refactorizaremos esto para soportar el flujo de Lobby.

**Flujo Propuesto:**
1.  **Landing Page**: Usuario introduce nombre -> Navega a `/call`.
2.  **Call Page (Inicialización)**: Se conecta el `StreamVideoClient` y se crea la instancia de `call`.
3.  **Estado "Lobby"**:
    *   En lugar de ejecutar `call.join()` automáticamente, mostramos el componente `<Lobby call={call} />`.
    *   El usuario ve su video y configura opciones.
4.  **Unirse**:
    *   Al hacer clic en "Unirse" en el Lobby -> Se ejecuta `call.join()`.
    *   La UI cambia a `<CallUI />` (la vista de llamada activa).

### Paso 3: Actualizar `useCallSession`
El hook `useCallSession` actualmente mezcla la creación de la llamada con el `join()`. Debemos separarlos:
*   `initCall()`: Crea el objeto `call` pero no se une.
*   `joinCall()`: Ejecuta la acción de unirse.

## 4. Ejemplo Técnico (Pseudocódigo)

```tsx
// Lobby.tsx
export const Lobby = ({ call, onJoin }: { call: Call, onJoin: () => void }) => {
  return (
    <div className="lobby-container">
      <h2>Sala de Espera</h2>
      <div className="video-preview">
        <VideoPreview />
      </div>
      <div className="controls">
        {/* Aquí irían selectores de dispositivos */}
        <button onClick={onJoin}>Unirse a la Llamada</button>
      </div>
    </div>
  );
};
```

## 5. Conclusión
La integración del Lobby mejorará significativamente la experiencia de usuario (UX), evitando que entren a la llamada con la cámara apagada o el micrófono incorrecto accidentalmente. Utilizaremos la arquitectura de componentes existente (`features/call`) para implementarlo de manera limpia.
