# Controles adyacentes y actualización continua — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Ejecución directa; sin subagentes, Git ni publicación.

**Goal:** Manipular cada figura/comparación y apreciar sus cambios sin desplazarse entre gráficos y controles.

**Architecture:** Conservar Astro/Canvas y el motor puro. Agrupar controles únicos y paneles primarios por etapa, con explicaciones y matemática después. Sustituir el debounce reiniciable por envíos acotados y permitir instantáneas intermedias coherentes, explícitamente pendientes, sin exportar resultados anteriores como actuales.

**Tech Stack:** Astro, TypeScript, Canvas, Web Worker, Vitest y Playwright/axe existentes; sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-27-adjacent-controls-design.md` (aprobado).

## Global Constraints

- Mantener seis capítulos, contenido, LaTeX, precisión, escalas, semilla y contrato JSON.
- Un solo control por parámetro: sin IDs duplicados ni estados divergentes al navegar.
- Sin barra fija que tape contenido; agrupación móvil sin exigir ver todos los paneles simultáneamente.
- Cálculo real, no imágenes aproximadas ni rebaja de resolución para aparentar rapidez.
- Una instantánea publicada contiene imágenes, métricas y configuración del mismo cálculo.
- Exportación solo cuando la última intención válida esté completamente confirmada.
- Conservar error/reintento, navegación, subruta y ciclo persisted pagehide.
- Trabajo local sin Git, nuevas dependencias, delegación ni publicación; autorrevisión final explícita.

## Review Focus

1. Arrastre más rápido que el cálculo: mostrar progreso sin inanición de resultados ni cola creciente.
2. Navegar entre capítulos durante un arrastre: controles únicos mantienen valores/foco y resultado coherente.
3. Cambiar número de vistas con una vista previa anterior: ángulo siempre válido para la imagen que se muestra.
4. Entrada inválida/fallo después de una vista previa: no habilitar exportación ni presentar datos viejos como vigentes.
5. Pantalla estrecha con matemáticas abiertas: controles/figura siguen próximos, sin solapamientos ni overflow.

## Archivos e interfaces

- Modificar `src/components/{Journey,ExperimentControls,ExperimentPanels}.astro`, `src/styles/global.css` y `src/ui/app.ts`: agrupación visual por capítulo y controles compartidos reubicables.
- Modificar `src/worker/{protocol,coordinator}.ts`: estado `calculating` puede contener la última instantánea terminada. `ready` sigue reservado al último pedido.
- Crear `src/ui/request-scheduler.ts`: `createRequestScheduler(submit: (config: ExperimentConfig) => void, intervalMs = 150)` devuelve `{ schedule(config): void; cancel(): void; dispose(): void }`. Primer envío inmediato; posteriores como máximo una vez por intervalo, conservando el último valor, sin esperar quietud.
- Ampliar `tests/unit/coordinator.test.ts`; crear `tests/unit/request-scheduler.test.ts` y `tests/e2e/adjacent-controls.spec.ts`.
- Actualizar `docs/design.md`, `README.md`, `VERIFICATION.md` y ledger propio `.superpowers/adjacent-controls-progress.md` (no sobrescribir el ledger anterior).

### Task 1: Flujo continuo y vistas previas coherentes

**Interfaces:** conservar `createCoordinator` y `CoordinatorState`; `current` significa última instantánea completada, no necesariamente último pedido. Consumir `ExperimentConfig` y `EngineResult` sin modificar motor.

- [ ] Escribir tests del scheduler con reloj de Vitest: primer valor enviado inmediatamente; entradas cada 40 ms durante 600 ms generan envíos antes de parar, separados ≥150 ms; último valor termina enviado; cancel/dispose impiden envíos posteriores.
- [ ] Ampliar tests de coordinador A/B/C: solo ejecutar A y C; al resolver A emitir `calculating/current=A/requested=C`; jamás `ready=A`. C termina `ready`; las respuestas ajenas, error/retry y dispose conservan sus protecciones. Añadir caso vistas 180→12.
- [ ] Ejecutar ambos archivos, observar fallos de comportamiento contra stubs/contrato previo y guardar evidencia.
- [ ] Implementar scheduler y publicación intermedia. Integrar app: mostrar snapshot con sus parámetros/metricas; estado visible «Updating» mientras difiere de intención válida; clamp del ángulo con las dimensiones mostradas. Entrada inválida cancela envío pendiente y bloquea publicaciones engañosas/export. Mantener retry al último valor válido requerido.
- [ ] Verificar `npm test` y `npm run check`, todo verde. Las pruebas de navegador existentes deben mantener sus contratos de `ready`, métricas, error y JSON.

### Task 2: Controles adyacentes y entrega visual verificada

**Interfaces:** conservar IDs de controles y selectores `canvas[data-kind]`; añadir bloques semánticos `data-interactive` con ranuras de controles por etapa. Mover nodos únicos al navegar, no clonar eventos/valores.

- [ ] Escribir pruebas de navegador antes del layout: ángulo/detector y filtros/corte/ruido comparten bloque con figuras primarias; no hay observaciones/details entre controles y figuras. En 320/390/1440 px, al enfocar/desplazar al slider, este y al menos parte de la figura afectada están visibles simultáneamente; separación vertical del bloque de controles/figura ≤96 px. Verificar valores persistentes y cero IDs duplicados al recorrer seis etapas, con matemáticas abiertas.
- [ ] Añadir arrastre sostenido con worker real: cambios de ruido cada 40 ms durante al menos 1.5 s, capturar al menos un resultado diferente durante el movimiento; snapshot intermedio identificado y export deshabilitado; al acabar esperar último valor y comparar JSON/métricas. Instrumentación solo de observación en el test, sin hooks de producción. Cubrir navegación durante arrastre, vista 180→12 y fallo/entrada inválida tras preview.
- [ ] Ejecutar `npm run test:e2e -- tests/e2e/adjacent-controls.spec.ts`, observar RED por distancia/ausencia del agrupamiento, no por fallo de servidor.
- [ ] Implementar bloques compactos: fantoma/vistas al inicio; controles contextuales inmediatamente junto a figuras primarias. En filtrado priman FBP/error; en ruido, rampa/Hann. Paneles auxiliares (referencia/BP/símbolo) permanecen accesibles sin interponerse. Agrupación móvil compacta, no barra fija. Estado de actualización junto al bloque; explicaciones/matemática después. Preservar etiquetas, teclado y foco.
- [ ] Ejecutar `npm test`, `npm run check`, `npm run build`, suite Playwright completa y `BASE_PATH=/preview/ SITE_URL=https://example.org npm run test:e2e`; pasar todos, incluyendo axe/reflow anteriores. Detener únicamente el preview de este proyecto si ocupa el puerto de tests.
- [ ] Inspeccionar capturas escritorio/móvil de geometría, filtrado y ruido; documentar evidencia y limitaciones. Autorrevisión contra cinco focos; corregir hallazgos importantes con RED→GREEN. Restaurar build raíz, iniciar preview loopback y comprobar HTTP + estado ready antes de compartirlo. Sin commits/publicación.

## Autorrevisión del plan

Cobertura: flujo continuo/preview en tarea 1; proximidad y geometría visual en tarea 2. Los cinco focos tienen casos concretos. Cambio semántico de `current` es deliberado y exige actualizar la expectativa A/B/C, no relajar `ready`. Nuevos tests visuales no deben confundirse con pruebas en dispositivos físicos. Intervalo 150 ms limita envíos, no promete una reconstrucción cada 150 ms.
