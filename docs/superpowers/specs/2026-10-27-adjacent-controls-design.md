# Controles junto a las figuras

Estado: diseño breve aprobado por el usuario el 2026-10-28; ejecución directa,
sin delegación ni publicación.

## Objetivo

Ver la relación entre mover un control y su efecto sin desplazarse entre la
figura y los controles. Cambio acotado de presentación e interacción; conservar
las seis etapas, contenido, LaTeX, motor numérico, escalas y exportación coherente.

## Alternativas

- Elegida: controles contextualizados junto a las figuras/comparaciones. Mantiene
  la relación visual; exige agrupar los paneles largos y adaptar móvil.
- Descartada: barra fija global. Siempre disponible, pero ocupa espacio y separa
  el control de la figura a la que corresponde, especialmente en móvil.

## Diseño propuesto

- Ángulo y detector junto a objeto/perfil; ángulo junto a sinograma y Fourier.
- Filtro/corte junto a la comparación de reconstrucciones; ruido/semilla junto
  a rampa/Hann. Fantoma y vistas al inicio del bloque experimental.
- Las observaciones y matemáticas quedan después del bloque interactivo, no
  entre la figura y sus controles. En móvil, controles y figura afectada se
  agrupan sin una barra fija que tape contenido; no se exige encajar todas las
  comparaciones simultáneamente en una pantalla pequeña.
- Ángulo, detector y selector de filtro conservan respuesta sin recalcular FBP.
- Durante un arrastre de corte/ruido se solicitan cálculos a intervalos acotados,
  no exclusivamente tras una pausa. Una reconstrucción terminada puede mostrarse
  como vista previa mientras hay parámetros posteriores pendientes: mostrar sus
  propios parámetros y señalar que sigue actualizándose. Nunca mezclar imágenes
  y métricas de cálculos distintos ni habilitar exportación de datos obsoletos.
- No prometer reconstrucción instantánea ni cambiar precisión para simularla.

## Aceptación

Pruebas de proximidad visual en escritorio/móvil, interacción por teclado,
actualización durante un arrastre sostenido con worker real, convergencia al
último valor, error/reintento y exportación coherente. Repetir suite existente,
tipos, build y navegador en raíz/subruta; inspeccionar capturas.

Sin dependencias nuevas, Git, delegación ni publicación. Implementación directa
en esta carpeta tras aprobación; documentación y autorrevisión locales.
