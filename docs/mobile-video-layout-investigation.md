# Investigación de Layout Móvil y Simulación (Resultados)

## 1. Análisis de Documentación del SDK
- **Componentes Core:** `ParticipantView` es el bloque fundamental. No hay un componente "MobileLayout" mágico que fuerce la transmisión vertical.
- **Transmisión:** El SDK de React no expone una prop directa `publishSettings={{ aspectRatio: '9/16' }}` en el componente `StreamVideo` o `Call`.
- **Conclusión:** La manipulación directa del `mediaStream` (como se planeó) es la vía correcta y estándar para WebRTC, incluso usando este SDK.

## 2. Validación de Estrategia "Simulador"
- **Visualización (Desktop):** La documentación de "Screen Sharing" y "Layouts" asume un diseño responsivo estándar. No hay impedimento para restringir el contenedor padre.
- **CSS vs JS:** Es más robusto usar CSS (`max-width: 480px`, `margin: 0 auto`) en el contenedor raíz de la llamada que intentar calcular tamaños con JS.

## 3. Refinamiento del Plan
- **Paso 1 (Wrapper):** Crear `MobileSimulatorWrapper` en `src/components/MobileSimulatorWrapper.tsx`.
- **Paso 2 (Constraints):** Mantener la lógica de `applyConstraints` en `LobbyScreen`, pero añadir manejo de errores robusto (algunas cámaras de PC fallan si se les pide 9:16 estricto).
- **Paso 3 (Estilos):** Asegurar que el fondo fuera del simulador sea oscuro para dar foco.

## 4. UI Cookbook & Customization Patterns

- **Hallazgos del Cookbook:**
  - La personalización de layouts se basa en CSS Grid/Flexbox estándar.
  - Se confirma que NO hay un "Mobile Simulator component" nativo.
  - La recomendación oficial para layouts personalizados es usar `ParticipantView` dentro de contenedores propios (dando validez a nuestro plan de `MobileSimulatorWrapper`).
