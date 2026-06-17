# Freekiland 3D 

Un prototipo de e-commerce y landing page para un estudio de impresión 3D en Sevilla, desarrollado con un enfoque visual premium, moderno y altamente funcional.

##  Sobre el Proyecto

Esta web es un **proyecto de prueba y prototipo** desarrollado de forma colaborativa por un pequeño grupo de estudiantes de los ciclos de **DAM** y **DAW**.

El objetivo principal de este repositorio es **mostrar y poner en práctica nuestros conocimientos** en el desarrollo Frontend (HTML semántico, CSS avanzado y Vanilla JavaScript), creando una experiencia de usuario (UX/UI) de alta calidad.

###  Notas sobre esta versión (Prototipo)
Al ser una maqueta funcional demostrativa, hay un par de detalles a tener en cuenta:
* **Imágenes de Muestra:** Faltan algunas imágenes definitivas en la galería debido a problemas con el stock durante la fase de desarrollo. Se han dejado los espacios y estructuras preparadas.
* **Pedidos por correo:** El carrito es totalmente funcional a nivel de cliente (lógica, almacenamiento y cálculo). Al pulsar "Solicitar pedido" se abre el correo del visitante con el resumen del carrito preparado para enviarlo a la tienda (no hay pasarela de pago, ya que no era un requisito de esta fase).

###  Configuración pendiente para producción
* **Formulario de contacto:** por defecto usa `mailto:` como respaldo. Para envío real sin abrir el correo del visitante, crea una access key gratuita en [web3forms.com](https://web3forms.com) y pégala en la constante `WEB3FORMS_KEY` al inicio de `carrito-app.js`.
* **Imágenes:** las fotos de `imagenes/` son originales de cámara (3–8 MB). Antes de publicar, redimensiónalas a ~600 px y conviértelas a WebP (por ejemplo con [squoosh.app](https://squoosh.app)) manteniendo los mismos nombres. El HTML ya tiene `loading="lazy"` y dimensiones declaradas.
* **Open Graph:** en cada `<head>` hay metaetiquetas `og:*` con rutas relativas; al publicar, cámbialas por URL absolutas con el dominio final.
* **Limpieza:** dentro de `imagenes/` hay un `.zip` de ~94 MB que no debe subirse al hosting.

---

##  Características 

Aunque es un prototipo, el proyecto cuenta con características avanzadas de desarrollo web:

* **Diseño UI/UX Premium (Dark Aurora):** Interfaz oscura con acentos de neón, uso de *Glassmorphism* (`backdrop-filter`) y fondos animados mediante CSS puro.
* **Carrito de Compras (Vanilla JS):** Sistema de carrito modular con persistencia de datos mediante `localStorage`. Permite añadir, eliminar y modificar cantidades en tiempo real.
* **Animaciones al Scroll:** Implementación de `IntersectionObserver` para revelar elementos de forma optimizada a medida que el usuario navega por la página.
* **Componentes Propios:** Desarrollo desde cero de notificaciones tipo *Toast*, diálogos de confirmación modales y menús responsivos tipo hamburguesa sin depender de librerías externas.
* **Accesibilidad y Rendimiento (a11y):** Uso de etiquetas ARIA (`aria-live`, `aria-expanded`), variables CSS (`:root`) para un sistema de diseño escalable y soporte para `prefers-reduced-motion`.
