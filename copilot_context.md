💡 Contexto general:
Este proyecto se llama **"Hora Incierta"**, una experiencia audiovisual interactiva (proyecto de grado de artes).  
Se basa en un recorrido narrativo dividido en capítulos (1 a 6) donde el usuario avanza o toma decisiones que alteran el flujo visual y sonoro.  
Cada capítulo tiene un ambiente diferente: túnel, desierto, pasillo de puertas, jardín y túnel final.

Los elementos interactivos incluyen audios (Off Muerte), íconos, clips, podcasts, y efectos visuales de transición.  
El proyecto busca reflejar una atmósfera inmersiva, reflexiva y artística con estilo cinematográfico.

🎯 Objetivo:
Refactorizar e implementar un flujo narrativo dinámico en React (Next.js o Vite + React) que:
1. Cargue los capítulos y sus nodos desde una estructura JSON.
2. Use scroll vertical progresivo (no carrusel).
3. Renderice automáticamente fondos, videos, audios e íconos según el contexto de cada capítulo.
4. Sea completamente **responsivo para móvil**, con foco en la **estética visual y la experiencia inmersiva**.
5. Utilice las imágenes y videos locales ubicados en **/src/images** (Pasillo.png, Desierto.png, Jardi.png, Texturas.png, etc.).
6. Soporte componentes tipo `<Scene />`, `<AudioLayer />`, `<InteractiveIcons />`, `<Choice />` para decisiones.

🧩 Flujo narrativo (resumen del PDF):
- **Capítulo 1 – Preludio:** fondo negro → ambiente túnel → audio Off Muerte 1.1–1.3 → entra primera locación.
- **Capítulo 2 – El principio del fin:** túnel → audios 2.1–2.5 → ícono "La Luz" → documental.
- **Capítulo 3 – Lugar incierto:** desierto → íconos (reloj, estatua, baldosa, flor) → vistas 360° → transición.
- **Capítulo 4 – No todas las puertas conducen al final:** pasillo de puertas → íconos de puertas y radionovela → decisiones.
- **Capítulo 5 – No busques el cielo, vivílo:** jardín → ícono “jazmín de noche” → videoclip.
- **Capítulo 6 – Lo que deba ser, será:** túnel final → ícono “la luz” → videopodcast → destello → detrás de cámaras / créditos.

🎨 Estilo visual y UX/UI deseado:
- Experiencia inmersiva tipo “scroll cinematográfico”.
- Fondos a pantalla completa con degradados y leves animaciones de entrada/salida.
- Uso de **Framer Motion** para transiciones (fade, parallax, blur).
- Tipografía elegante, minimalista y artística.
- Efectos de sonido sincronizados con las decisiones.
- Navegación sin botones visibles, basada en scroll o íconos contextuales.

⚙️ Tecnologías recomendadas:
- React 18+ o Next.js 14+
- TailwindCSS
- Framer Motion
- React Hooks (useState, useEffect, useRef)
- Estructura modular (componentes por escena)
- Compatible con JSON narrativo (por ejemplo `/data/route.json`)

🧠 Solicitud a Copilot:
- Genera un componente principal `<ButterflyFlow />` que lea la narrativa desde JSON y renderice dinámicamente los capítulos y decisiones.
- Usa las imágenes locales de `/src/images` para fondos.
- Implementa un flujo vertical interactivo con animaciones suaves y transiciones artísticas.
- Prioriza diseño visual, UX, UI y responsividad móvil.
- Mantén el código limpio, modular y sin errores de compilación.
