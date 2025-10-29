# 🦋 The Butterfly Effect - Interactive Storytelling

Un proyecto artístico interactivo donde cada decisión del usuario crea ondas que cambian la narrativa visual. Inspirado en el concepto del "efecto mariposa", esta experiencia combina storytelling inmersivo con animaciones fluidas y diseño responsivo.

## ✨ Características

- **Narrativa Interactiva**: Cada decisión lleva a diferentes caminos y finales
- **Animaciones Fluidas**: Implementado con Framer Motion para transiciones elegantes
- **Diseño Responsivo**: Optimizado para móviles y desktop
- **Media Dinámico**: Soporte para videos e imágenes con efectos parallax
- **Efectos Visuales**: Partículas flotantes, efectos de glow y transiciones suaves
- **Arquitectura Modular**: Componentes React reutilizables y mantenibles

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### Instalación

1. **Clona o descarga el proyecto**
   ```bash
   cd LoloFinalProyect
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abre tu navegador**
   ```
   http://localhost:3000
   ```

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/
│   ├── ButterflyFlow.jsx    # Componente principal que maneja el flujo
│   ├── Scene.jsx            # Renderiza cada escena individual
│   ├── DecisionButton.jsx   # Botones de decisión interactivos
│   └── MediaPlayer.jsx      # Reproductor de video/imagen con parallax
├── data/
│   └── story.json          # Estructura JSON del storytelling
├── App.jsx                 # Aplicación principal
├── main.jsx               # Punto de entrada
└── index.css             # Estilos globales y TailwindCSS
```

## 🎨 Personalización

### Agregar Nuevas Escenas

Edita `src/data/story.json` para añadir nuevos nodos:

```json
{
  "nuevo_nodo": {
    "id": "nuevo_nodo",
    "type": "scene",
    "title": "Tu Título",
    "content": "Descripción de la escena...",
    "media": {
      "type": "video", // o "image"
      "src": "url_del_medio",
      "autoplay": true,
      "loop": true,
      "muted": true,
      "parallax": true
    },
    "decisions": [
      {
        "id": "choice_x",
        "text": "Opción 1",
        "description": "Descripción de la decisión",
        "nextNodeId": "siguiente_nodo",
        "color": "purple" // amber, purple, emerald, cyan, etc.
      }
    ]
  }
}
```

### Colores Disponibles para Decisiones
- `amber`, `purple`, `emerald`, `cyan`, `indigo`, `slate`, `rose`, `teal`, `red`, `violet`

### Modificar Animaciones

Las animaciones se configuran en cada componente usando Framer Motion:

```jsx
const variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 }
};
```

## 🎯 Tecnologías Utilizadas

- **React 18** - Framework principal
- **Framer Motion** - Animaciones y transiciones
- **TailwindCSS** - Styling utilitario
- **Vite** - Build tool y desarrollo
- **JavaScript ES6+** - Lenguaje de programación

## 📱 Características Responsivas

El diseño está optimizado para:
- **Desktop** (1024px+): Experiencia completa con efectos avanzados
- **Tablet** (768px-1023px): Adaptación de tamaños y espaciados
- **Mobile** (320px-767px): Interfaz táctil optimizada

## ♿ Accesibilidad

- Soporte para `prefers-reduced-motion`
- Alto contraste con `prefers-contrast: high`
- Navegación por teclado
- Textos descriptivos para lectores de pantalla

## 🔧 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter ESLint
```

## 🎨 Guía de Estilo Visual

### Paleta de Colores
- **Fondo**: Negro profundo (#000000)
- **Texto**: Blanco (#FFFFFF) con variaciones de opacidad
- **Acentos**: Gradientes dinámicos según la decisión
- **Overlays**: Negro semi-transparente para legibilidad

### Tipografía
- **Display**: Playfair Display (títulos)
- **Body**: Inter (texto general)
- **Efectos**: Text-glow para títulos importantes

### Efectos Visuales
- Blur y backdrop-filter para glassmorphism
- Gradientes radiales animados
- Partículas flotantes en background
- Efectos parallax en media
- Transiciones suaves entre estados

## 🚀 Próximas Características

- [ ] Sistema de guardado de progreso
- [ ] Múltiples idiomas
- [ ] Modo offline
- [ ] Sharing de rutas específicas
- [ ] Editor visual para crear historias
- [ ] Soporte para audio ambiente
- [ ] Análiticas de decisiones de usuarios

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**Desarrollado con ❤️ para crear experiencias interactivas únicas**