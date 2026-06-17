# Design

Sistema visual de Freekiland 3D, extraído de `estilos.css` (fuente de verdad: tokens en `:root`).

## Theme

Oscuro único en toda la web (sin modo claro). "Dark aurora": fondos casi negros con tinte verdoso, brillos radiales ambientales de la familia teal y grano fotográfico sutil (2,7%).

## Color

| Rol | Token | Valor |
|-----|-------|-------|
| Fondo base | `--c-bg-1` | `#0a0f0d` |
| Fondo profundo | `--c-bg-0` | `#06090a` |
| Superficie | `--c-surface` → `--c-surface-3` | `#161b19` → `#28342f` |
| Texto | `--c-text` | `#ecf1ee` |
| Texto suave / mute | `--c-text-soft` / `--c-text-mute` | `#b3beb9` / `#7d8682` |
| **Acento principal** | `--c-accent` | `#1aab8a` (teal) |
| Acento secundario | `--c-accent-2` | `#99bc58` (lima) |
| Peligro / Aviso | `--c-danger` / `--c-warning` | `#ff5660` / `#ffc640` |
| Aurora decorativa | `--aurora-1..4` | familia teal/menta/azul (nunca magenta/oro) |

Regla: un solo acento (teal) lidera; el lima es apoyo en detalles. Los semáforos (danger/warning) no se usan como decoración.

## Typography

- **Display**: Vidaloka (serif), solo para titulares y nombres. `text-wrap: balance`.
- **Cuerpo**: Inter, line-height 1.6+, máx ~70ch.
- Jerarquía por escala con `clamp()`; titulares ≤ 5rem.
- Texto degradado solo en el titular del hero del index (firma de marca animada). El resto de titulares: blanco sólido.

## Components

- **Radios**: `--r-sm 8` (inputs) · `--r-md 14` · `--r-lg 22` (cards) · pill 999 (botones/badges). Sistema documentado: botones pill, tarjetas 22, inputs 8.
- **Botones**: gradiente teal→teal-profundo, pill, lift -2/-3px en hover, hundimiento `scale(0.97)` en active.
- **Tarjetas**: superficie con borde 1px `--c-line`, hover = lift + borde acento + glow suave.
- **Toasts/Confirm**: inyectados por JS, borde tintado por tipo semántico.
- **Z-index**: `--z-header 1000 · --z-modal 9000 · --z-toast 9500 · --z-confirm 9600`. Nunca valores sueltos.

## Motion

- Easing global `--ease: cubic-bezier(0.22, 1, 0.36, 1)`; duraciones `--t-fast .18s / --t-med .35s / --t-slow .6s`.
- Reveal al scroll vía IntersectionObserver (`.reveal` → `.revealed`), solo con la clase `js` en `<html>`.
- Animaciones perpetuas solo donde son contenido (marquees de galería, aurora de fondo); los adornos (anillos de avatar) se animan en hover.
- Todo respeta `prefers-reduced-motion` (bloqueo global al final de `estilos.css`).

## Layout

- Contenedor máx `--container: 1240px`; header fijo `--header-h: 78px`.
- Breakpoints: 960 (nav móvil), 900, 768, 480.
- Secciones con padding `clamp()` generoso; separadores con degradado que se desvanece en los bordes.
- Footer de 3 columnas (marca / navegación / contacto) idéntico en las 5 páginas.
