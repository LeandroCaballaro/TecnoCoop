# TecnoCoop — Informe técnico y especificación del sistema

**Precooperativa escolar de reparación tecnológica y electrodomésticos**
Escuela: [completar] · Curso: [completar] · Integrantes: [completar] · Fecha: noviembre de 2026

> **Convención de estados.** En todo el documento cada función se rotula como **[DISEÑADO]** (especificado, sin código),
> **[IMPLEMENTADO]** (existe código en este repositorio) o **[SIMULADO]** (funciona con datos o roles ficticios).
> Estado real del repositorio al redactar este informe: ver la sección 9.

## Índice

1. Análisis de usuarios e historias de usuario
2. Diseño de interfaz y modelado de datos
3. Arquitectura y diseño del sistema (Vue.js + Supabase)
4. Selección y diseño de visualizaciones
5. Implementación del tablero
6. Informe de seguimiento y cierre
7. Planificación y prueba de funcionamiento
8. Conclusiones finales y exposición
9. Estado real: diseñado, implementado y simulado
10. Matriz de coherencia

---

## 1. Análisis de usuarios e historias de usuario

### 1.1 Tipos de usuario

| Usuario | Quién es en la cooperativa | ¿Tiene cuenta? | Qué puede hacer |
|---|---|---|---|
| **Cliente / Vecino** | Alumno, docente, escuela, vecino o comercio que trae un equipo | No en la v1 (se identifica con nombre y contacto que carga Recepción) | Recibir el comprobante y consultar el estado por pedido a Recepción. En una v2: consultar su solicitud con un código. |
| **Recepción** (Secretaría y Comisión de Recepción, Logística y Stock) | Estudiantes que reciben y entregan equipos | Sí, rol `recepcion` | Registrar clientes y solicitudes, avanzar estados, cancelar con motivo, gestionar repuestos, ver el tablero. |
| **Técnico/a** (Comisiones de Reparación Móvil e Informática y Electromecánica) | Estudiantes que diagnostican y reparan | Sí, rol `tecnico` | Ver solicitudes, avanzar el estado (diagnóstico → reparación → listo), registrar resultado y repuestos usados, ver el tablero. No crea ni cancela solicitudes. |
| **Administración** (Presidencia y Tesorería) | Conduce la cooperativa, presupuesta y cobra | Sí, rol `admin` | Todo lo anterior más presupuesto y cobro, gestión de cuentas y roles, y el informe de seguimiento. |
| **Consulta** (Sindicatura) | Controla cuentas, plazos y cumplimiento del estatuto | Sí, rol `consulta` | Solo lectura: tablero e informe de seguimiento. No modifica nada. |

La Comisión de Comunicación y Difusión no necesita cuenta: usa el informe impreso como insumo para carteleras y redes.

### 1.2 Historias de usuario

| N.º | Historia | Criterio de aceptación |
|---|---|---|
| H1 | Como **recepcionista**, quiero **registrar un equipo con los datos del cliente y la falla** para **dejar constancia de su ingreso y entregar un comprobante**. | No se guarda si faltan campos obligatorios; la solicitud nace en estado «Recibido». |
| H2 | Como **técnico**, quiero **cambiar el estado de una reparación y registrar su resultado** para **que Recepción y el cliente sepan en qué etapa está el equipo**. | Solo se puede pasar al estado siguiente; queda en el historial. |
| H3 | Como **tesorero**, quiero **cargar el presupuesto y el cobro de cada reparación** para **llevar la caja y calcular el ahorro de la comunidad**. | Los importes no pueden ser negativos. |
| H4 | Como **síndico**, quiero **consultar el tablero y el informe del período sin poder modificar datos** para **controlar plazos y cuentas con independencia**. | Los botones de edición no aparecen y la base rechaza escrituras. |
| H5 | Como **presidente**, quiero **ver cuántos equipos se repararon y en cuánto tiempo** para **decidir si se necesitan más técnicos o más repuestos**. | El tablero muestra metas y período; si no se puede calcular, lo explica. |
| H6 | Como **recepcionista**, quiero **cancelar una solicitud indicando el motivo** para **no perder el historial cuando el cliente desiste**. | Cancelar no borra: cambia el estado y exige un motivo de al menos 5 caracteres. |

---

## 2. Diseño de interfaz y modelado de datos

### 2.1 Pantallas principales

| Pantalla | Ruta | Roles | Contenido |
|---|---|---|---|
| Ingreso | `/login` | Todos | Con Supabase: correo y contraseña. Sin Supabase: selector de rol **simulado**, con aviso visible. |
| Solicitudes | `/` | Todos | Búsqueda por texto, filtro por estado, listado en tabla (computadora) o tarjetas (celular), formulario de alta, botón «Avanzar» y «Cancelar» según rol. |
| Tablero | `/tablero` | Todos | Filtros de período y categoría, tres indicadores con meta, tres gráficos, hora de actualización y botón «Actualizar». |
| Informe de seguimiento | `/informe` | `admin` y `consulta` | Período, objetivo, fuente, indicadores con meta, tabla, gráfico, interpretación y botón «Imprimir / Guardar PDF». |

Boceto del alta (computadora):

```
+--------------------------------------------------------------+
| TecnoCoop · Solicitudes   Tablero   Informe    [Rol] [Salir] |
+--------------------------------------------------------------+
| Nueva solicitud                                              |
|  Cliente [__________]   Contacto [__________]  Tipo [v]      |
|  Categoría [v]   Equipo [__________]                         |
|  Falla  [____________________________________]  (mín. 10)    |
|  [Registrar equipo]                                          |
+--------------------------------------------------------------+
| Buscar [________]  Estado [Todos v]                          |
| #  Cliente        Equipo   Estado          Acciones          |
| 21 Luis Gómez     Notebook ● Recibido      [Avanzar][Cancelar]|
+--------------------------------------------------------------+
```

### 2.2 Recorrido: registrar un equipo para reparar

1. La persona de Recepción ingresa y elige su rol (o inicia sesión).
2. Abre **Solicitudes** y completa el formulario de alta.
3. El sistema valida cada campo y muestra el error junto al campo.
4. Al confirmar, aparece «Cargando…», luego un mensaje de confirmación con el número de solicitud.
5. La solicitud aparece arriba del listado en estado «Recibido».
6. Se entrega al cliente el comprobante con el número.

### 2.3 Información que guarda el sistema y quién la ve

| Dato | Quién consulta | Quién modifica |
|---|---|---|
| Perfiles y roles | `admin` (todos), cada usuario el suyo | `admin` |
| Clientes (nombre, contacto, tipo) | Todos los roles con cuenta | `admin`, `recepcion` |
| Solicitudes (equipo, falla, estado, resultado, fechas) | Todos los roles con cuenta | Alta: `admin`, `recepcion`. Estado: `admin`, `recepcion`, `tecnico`. |
| Historial de estados | Todos los roles con cuenta | Solo se agrega (`admin`, `recepcion`, `tecnico`); nadie lo edita ni lo borra. |
| Repuestos y stock | Todos los roles con cuenta | `admin`, `recepcion` |
| Repuestos usados por solicitud | Todos los roles con cuenta | `admin`, `tecnico` |
| Presupuesto y cobro | Todos los roles con cuenta | `admin` (Tesorería) |

### 2.4 Modelo relacional

```
auth.users 1─1 perfiles 1─* historial_estados *─1 solicitudes *─1 clientes
                  perfiles 1─* solicitudes (técnico asignado)
solicitudes 1─* solicitud_repuestos *─1 repuestos
```

| Tabla | Clave primaria | Claves foráneas | Reglas |
|---|---|---|---|
| `perfiles` | `id` (uuid) | `id` → `auth.users` | `rol` ∈ admin, recepcion, tecnico, consulta |
| `clientes` | `id` | — | `tipo` ∈ alumno, docente, escuela, vecino, comercio |
| `solicitudes` | `id` | `cliente_id` → `clientes`, `tecnico_id` → `perfiles` | `estado` y `resultado` con valores permitidos; importes ≥ 0 |
| `historial_estados` | `id` | `solicitud_id`, `usuario_id` | `on delete restrict`: el historial no se pierde |
| `repuestos` | `id` | — | `stock` ≥ 0, `costo` ≥ 0 |
| `solicitud_repuestos` | (`solicitud_id`, `repuesto_id`) | ambas | `cantidad` > 0 |

### 2.5 Script SQL

El script completo y ejecutable está en [`db/schema.sql`](../db/schema.sql): crea las seis tablas, activa RLS y define las políticas
por rol. Fragmento representativo:

```sql
create table solicitudes (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references clientes on delete restrict,
  tecnico_id uuid references perfiles,
  categoria text not null check (categoria in ('movil','informatica','electrodomestico')),
  equipo text not null,
  falla text not null,
  estado text not null default 'recibido'
    check (estado in ('recibido','en_diagnostico','presupuestado','en_reparacion','listo','entregado','cancelado')),
  resultado text check (resultado in ('reparado','no_reparable')),
  presupuesto numeric(10,2) check (presupuesto >= 0),
  cobrado numeric(10,2) check (cobrado >= 0),
  creada_en timestamptz not null default now(),
  entregada_en timestamptz
);
```

---

## 3. Arquitectura y diseño del sistema

### 3.1 Justificación de Vue.js y Supabase

- **Vue 3 + Vite:** curva de aprendizaje baja para estudiantes, componentes reutilizables (el mismo gráfico sirve al tablero y al informe) y arranque rápido.
- **Supabase:** ofrece base PostgreSQL, autenticación y políticas RLS sin escribir un servidor propio. Los permisos viven **en los datos**, no solo en la pantalla.

**¿Se necesita backend?** Sí. Sin backend los datos quedarían en `localStorage` del navegador, con estas limitaciones:

| Limitación sin backend | Consecuencia |
|---|---|
| Los datos no se comparten entre dispositivos | Recepción y Técnicos verían listas distintas. |
| Se pierden si se borra el navegador | Sin historial confiable. |
| No hay autenticación real | Cualquiera puede elegir el rol «admin». |
| No se pueden hacer cumplir permisos | La Sindicatura no podría garantizar que nadie edita. |

Por eso la **demo sin Supabase es solo una simulación** y está rotulada como tal en pantalla.

### 3.2 Organización del proyecto

```
src/
  constants.js          estados, categorías, roles, metas (ficticias)
  lib/supabase.js       cliente con URL y clave pública
  services/             auth, permisos, datos, validaciones, métricas
  components/BarChart.vue
  views/                Login, Solicitudes, Tablero, Informe
  router/index.js       rutas y guardias por rol
  data/mock.js          datos de prueba ficticios
db/schema.sql           estructura y políticas
```

### 3.3 Formularios, validaciones y navegación por roles

Las validaciones están en `src/services/validar.js` y se ejecutan antes de enviar:

| Campo | Regla |
|---|---|
| Cliente | Obligatorio, mínimo 3 caracteres |
| Contacto | Correo válido o teléfono de 8 a 15 dígitos |
| Tipo de cliente y categoría | Valor de la lista permitida |
| Equipo | Obligatorio, mínimo 3 caracteres |
| Falla | Obligatoria, mínimo 10 caracteres |
| Motivo de cancelación | Obligatorio, mínimo 5 caracteres |

La navegación se protege con `router.beforeEach`: sin sesión se redirige a `/login`; con sesión pero sin permiso (por ejemplo `tecnico` en `/informe`) se vuelve a `/`.
La matriz está en `src/services/permisos.js` y es la misma que las políticas RLS.

**Roles simulados vs. reales.** Sin variables `VITE_SUPABASE_*` el ingreso es un selector de rol sin contraseña **[SIMULADO]**. Con Supabase configurado el selector desaparece, se exige correo y contraseña y el rol sale de la tabla `perfiles` **[DISEÑADO + código listo, sin probar contra una base real]**.

### 3.4 Operaciones, búsquedas, filtros y estados

| Operación | Cómo se hace |
|---|---|
| Registrar | Alta de cliente y solicitud; entrada inicial en el historial |
| Consultar | Listado con búsqueda de texto y filtro por estado |
| Modificar | Avance de estado en secuencia: recibido → en diagnóstico → presupuestado → en reparación → listo → entregado |
| Eliminar | **No existe borrado.** Se **cancela** con motivo, para conservar el historial y la trazabilidad que pide la Sindicatura |

### 3.5 Autenticación y RLS

Las políticas (en `db/schema.sql`) usan la función `rol_actual()`, que lee el rol del usuario autenticado:

```sql
create policy "crear solicitudes" on solicitudes
  for insert with check (rol_actual() in ('admin','recepcion'));
create policy "editar solicitudes" on solicitudes
  for update using (rol_actual() in ('admin','recepcion','tecnico'));
```

Así, aunque alguien manipule la interfaz, la base rechaza la escritura de un rol sin permiso.

**Limitación de RLS y cómo se resolvió.** RLS decide por fila, no por columna ni por transición: solo con políticas, un `tecnico` podría saltándose la interfaz cambiar el presupuesto o el cobro, cancelar o saltear estados. Por eso `db/schema.sql` incluye el *trigger* `solicitudes_validar`, que exige en la base: presupuesto y cobro solo de `admin`; secuencia de estados (recibido → en diagnóstico → presupuestado → en reparación → listo → entregado); y cancelar solo `admin` y `recepcion`, nunca sobre una solicitud entregada o ya cancelada.
**Verificación:** estas reglas se probaron en un Postgres local (PGlite) simulando `auth.uid()` (`npm run test:rls:local`, 19 casos aprobados). **No se probaron en Supabase real**: el script `tests/rls.e2e.mjs` está listo pero depende de un proyecto creado (ver `docs/SUPABASE.md`).
Para crear usuarios: alta en *Authentication* de Supabase y una fila en `perfiles` con su rol.

### 3.6 Diseño responsive y datos de prueba

- **Responsive:** diseño de una columna pensado primero para celular (375 px); en pantallas anchas el listado pasa de tarjetas a tabla y los gráficos se ubican en grilla. Botones de al menos 44 px de alto, texto base de 16 px y sin desplazamiento horizontal de la página. **[DISEÑADO]**
- **Datos de prueba:** un aviso fijo en la cabecera («Datos de prueba · roles simulados») se muestra mientras no haya Supabase configurado, y los nombres de la semilla son ficticios. **[DISEÑADO]**

### 3.7 Carga, confirmación, errores y secretos

- Cada operación muestra «Cargando…», luego una confirmación o un mensaje de error comprensible.
- Los errores del servidor se muestran sin detalles internos.
- En el cliente solo van `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La clave `service_role` **nunca** se incluye en el código, el repositorio ni este informe; `.env` está en `.gitignore`.

---

## 4. Selección y diseño de visualizaciones

**Quién consulta:** Presidencia y Tesorería (decisiones operativas), Sindicatura (control), comisiones operativas (carga de trabajo).

### 4.1 Planificación

| N.º | Pregunta | Decisión que facilita | Variables y datos | Gráfico | Justificación |
|---|---|---|---|---|---|
| G1 | ¿En qué etapa está cada solicitud? | Dónde reforzar trabajo (¿se acumulan en diagnóstico?) | `solicitudes.estado` (categórica), conteo | Barras horizontales | Compara categorías con etiquetas largas; es más legible que un gráfico circular con 7 estados. |
| G2 | ¿Qué tipo de equipo llega más? | Qué comisión y qué repuestos priorizar | `solicitudes.categoria`, conteo y % | Barras horizontales con % y total | Compara pocas categorías y muestra su peso sobre el total. |
| G3 | ¿Cómo evoluciona el ingreso de equipos por semana? | Anticipar picos y organizar turnos | `solicitudes.creada_en` agrupada por semana | Columnas verticales | El orden temporal se lee de izquierda a derecha. |

### 4.2 Diseño e interpretación

Elementos comunes: título que dice qué mide, subtítulo con **período y unidad**, valor escrito sobre cada barra, escala que **empieza en cero**, mismo color para el mismo estado en todos los gráficos, texto de al menos 12 px y contraste suficiente sobre fondo claro. Los estados se acompañan siempre de su **etiqueta de texto**, no solo del color.
Cuando se muestran porcentajes se indica el **total** («Total: 22 solicitudes (100%)»).

**Principios de Gestalt aplicados**

1. **Similitud:** el mismo color identifica el mismo estado en todos los gráficos y tablas; el ojo agrupa «lo entregado» y distingue «lo cancelado» sin leer.
2. **Proximidad:** la etiqueta, la barra y el valor de cada fila están pegados y separados de la fila siguiente, de modo que se lee cada categoría como una unidad.

**Interpretación** (valores de la semilla ficticia: 22 solicitudes)

| Gráfico | Qué muestra | Conclusión que permite | Qué NO puede afirmarse |
|---|---|---|---|
| G1 Estado | 14 entregadas (64 %), 2 recibidas, 2 en reparación, 1 listo, 1 presupuestada, 1 en diagnóstico, 1 cancelada | La mayor parte del trabajo ingresado ya se cerró; hay 7 equipos en curso. | No dice si hay demoras: falta el tiempo en cada estado. |
| G2 Categoría | Informática 41 %, electrodomésticos 32 %, móvil 27 % (total 22) | Informática concentra la demanda; conviene reforzar esa comisión. | No indica el esfuerzo ni el costo: una notebook no equivale a una pava. |
| G3 Semana | Solicitudes ingresadas por semana | Se ven semanas con más ingreso que otras. | Con pocas semanas no se puede afirmar una tendencia ni estacionalidad. |

### 4.3 Implementación en Vue.js

El componente `src/components/BarChart.vue` **[IMPLEMENTADO]** recibe `titulo`, `subtitulo`, `items` (`{ etiqueta, valor, color }`), `vertical` y `mostrarPorcentaje`. Los datos salen de `src/services/metrics.js` (`porEstado`, `porCategoria`, `porSemana`). El mismo componente se reutiliza en el tablero y en el informe.

```vue
<BarChart titulo="Solicitudes por estado" subtitulo="Últimos 30 días · cantidad de solicitudes"
          :items="porEstado(filtradas)" mostrar-porcentaje />
```

---

## 5. Implementación del tablero

**Usuarios:** Presidencia, Tesorería, Sindicatura y comisiones operativas.
**Decisiones:** reforzar técnicos o repuestos, revisar plazos de entrega, informar logros a la escuela.

### 5.1 Indicadores

| KPI | Fórmula | Unidad | Meta (ficticia) | Datos | Justificación |
|---|---|---|---|---|---|
| Equipos reparados y entregados | Entregados con resultado «reparado» | equipos | ≥ 10 en el período | `estado`, `resultado` | Mide el impacto comunitario y ambiental central. |
| Reparaciones exitosas | Reparados ÷ entregados × 100 | % de entregados | ≥ 80 % | `estado`, `resultado` | Mide el impacto educativo (calidad del aprendizaje aplicado). |
| Tiempo medio hasta la entrega | Promedio de `entregada_en − creada_en` | días | ≤ 7 días | `creada_en`, `entregada_en` | Lo que más percibe el cliente y controla la Sindicatura. |

Los dos primeros salen de los indicadores de impacto de la idea general del proyecto (dispositivos reparados y porcentaje de reparaciones exitosas). El tercero (tiempo medio) es una incorporación para el control de la Sindicatura. **Verificar contra los cuatro KPI definidos en la etapa anterior**, que no estaban en el material con que se redactó este informe. Los de **ahorro económico** y **kilos de residuos** quedan pendientes porque requieren datos que la v1 no registra (precio comercial de referencia y peso del equipo).

Valores de la semilla ficticia (período completo): 12 reparados (meta cumplida), 86 % de éxito (cumplida), 4,5 días de media (cumplida). Son datos de prueba, no resultados reales.

### 5.2 Filtro y actualización

- **Filtros:** período (últimos 7 días, últimos 30 días, todo) y categoría. Ambos afectan a los tres indicadores y a los tres gráficos, porque todo se calcula con la misma lista filtrada (`filtrar()` en `metrics.js`).
- **Actualización:** la información se carga **al ingresar** y con el botón **«Actualizar»**; no hay tiempo real. Se muestra «Actualizado: fecha y hora».
- **Estados:** «Cargando…» durante la consulta; mensaje de error con botón «Reintentar» si falla; «No hay solicitudes en el período» si el filtro queda vacío.
- **Indicador no calculable:** si no hay equipos entregados, el éxito y el tiempo medio muestran «No calculable» y el motivo, **nunca un 0**.

---

## 6. Informe de seguimiento y cierre

| Elemento | Definición |
|---|---|
| Propósito | Explicar cómo funcionó el servicio en un período y sostener decisiones de mejora |
| Destinatarios | Presidencia, Tesorería, Sindicatura y la dirección de la escuela |
| Frecuencia | Mensual |
| Período | Elegible con dos fechas (desde / hasta) |
| Objetivo | Reparar equipos de la comunidad en plazo razonable, con aprendizaje aplicado |
| Fuente | Tabla `solicitudes` de Supabase (o datos de prueba en modo simulado) |
| Quién lo consulta | Roles `admin` y `consulta` |

La vista contiene: selector de período con validación (desde ≤ hasta), indicadores con meta y resultado («Cumplida / No cumplida / No calculable»), tabla de solicitudes del período, un gráfico reutilizado (estado) y un cuadro de interpretación redactado a mano.

**Exportar a PDF:** botón «Imprimir / Guardar PDF» → `window.print()`; en el diálogo del navegador elegir **Guardar como PDF**. Una hoja de estilos de impresión oculta menús y controles.

### 6.1 Interpretación (modelo con la semilla ficticia)

- **Metas cumplidas:** reparados (12 de 10), éxito (86 % de 80 %) y tiempo (4,5 de 7 días).
- **Dificultades:** 2 de 14 equipos no tuvieron reparación posible (disco dañado y motor de licuadora) y 1 solicitud se canceló; 9 días fue el plazo más largo.
- **Patrones:** informática es la categoría más demandada (41 %).
- **Necesita más información:** por qué hubo demoras (el sistema no registra el motivo: falta de repuestos, carga de trabajo u otra causa); el ahorro real para las familias (no se registra el precio de mercado).

**Acciones de mejora**

1. **Registrar el motivo de cada demora y la falta de repuestos** para confirmar la causa antes de comprar. Fundamento: el plazo más largo (9 días) no tiene causa registrada; sin ese dato no se puede decidir entre comprar repuestos o sumar técnicos.
2. **Reforzar la Comisión de Informática en las semanas de mayor ingreso** y mantener un stock mínimo de fuentes, memorias y discos. Fundamento: informática concentra el 41 % de las solicitudes.
3. **Agregar el peso del equipo y el precio comercial de referencia al alta** para medir los indicadores ambiental y económico.

---

## 7. Planificación y prueba de funcionamiento

### 7.1 Prueba piloto del servicio

| Aspecto | Definición |
|---|---|
| Duración | 4 semanas, un turno de recepción de 2 horas, dos veces por semana |
| Alcance | Hasta 20 equipos de la comunidad escolar |
| Personas | 2 recepcionistas, 4 técnicos, 1 tesorero, 1 síndico |
| Recursos disponibles | Aula-taller, multímetros, soldadores, herramientas manuales, pulseras antiestáticas |
| Recursos pendientes | Repuestos (pantallas, baterías, fuentes), caja inicial, cuenta de correo de la cooperativa |
| Costos **ficticios** | Fondo inicial $50.000 · repuestos estimados $30.000 · insumos de soldadura $8.000 |
| Condiciones | Seguridad e higiene: no abrir equipos con tensión conectada, ESD, manejo de baterías de litio |

Todos los importes son valores de ejemplo y se reemplazan con los reales del acta de la cooperativa.

### 7.2 Cronograma

| Semana | Actividad | Rol responsable | Resultado esperado |
|---|---|---|---|
| 1 | Capacitación en seguridad y en el sistema | Presidencia, docentes | Todos los roles ingresan y registran |
| 1 | Difusión en la escuela | Comunicación y Difusión | Primeras 5 solicitudes |
| 2 | Recepción y diagnóstico | Recepción, técnicos | 10 solicitudes, estados al día |
| 3 | Reparación y compra de repuestos | Técnicos, Tesorería | Al menos 5 entregas |
| 4 | Entregas, tablero e informe | Recepción, Sindicatura | Informe del período firmado por Sindicatura |

### 7.3 Recorrido completo de una solicitud (ficticia)

| Paso | Acción | Responsable | Recursos | Dato generado |
|---|---|---|---|---|
| 1 | Una vecina trae una pava eléctrica que no calienta | Recepción | Formulario del sistema | `clientes` y `solicitudes` (estado «Recibido») + historial |
| 2 | Diagnóstico con multímetro: resistencia cortada | Técnico (Electromecánica) | Tester, hoja de seguridad | Estado «En diagnóstico» + nota |
| 3 | Presupuesto: resistencia $2.500 + mano de obra $1.500 | Tesorería | Planilla de precios | `presupuesto = 4000`, estado «Presupuestado» |
| 4 | Aprobación de la vecina | Recepción | — | Estado «En reparación» |
| 5 | Cambio de resistencia y prueba; Recepción/Logística descuenta la pieza del stock | Técnico y Recepción | Repuesto, soldador | `solicitud_repuestos` (Técnico), `stock − 1` (Recepción) |
| 6 | Aviso «Listo para retirar» | Recepción | Teléfono | Estado «Listo», `resultado = reparado` |
| 7 | Retiro y cobro | Recepción y Tesorería | Caja | Estado «Entregado», `entregada_en`, `cobrado = 4000` |

### 7.4 Imprevisto: el repuesto no llega

**Situación.** Para una notebook, el disco comprado resulta defectuoso y el plazo de 7 días se va a superar.

| Etapa | Qué se hace |
|---|---|
| Detección | El técnico lo advierte al probar el disco; el tablero lo confirmaría al subir el tiempo medio. |
| Registro | El técnico anota el hecho en el historial de la solicitud; Tesorería registra el reclamo al proveedor. |
| Resolución | Tesorería gestiona el cambio; mientras, Recepción mantiene el estado «En reparación». |
| Comunicación | Recepción avisa al cliente la nueva fecha estimada, por el contacto registrado. |
| Reglamento | Se aplica la propuesta de reglamento interno: informar al cliente ante cualquier demora (art. propuesto 1), tomar decisiones de gasto entre Presidencia y Tesorería (art. propuesto 2) y dejar el caso asentado en acta para que Sindicatura lo controle (art. propuesto 3). *Los números de artículo son provisorios hasta tener el reglamento aprobado.* |

Si el cliente desiste, la solicitud se **cancela con motivo** y el historial se conserva.

### 7.5 Plan de pruebas del sistema

| N.º | Área | Caso | Resultado esperado |
|---|---|---|---|
| P1 | Formulario | Enviar vacío | Errores en cada campo, no se guarda |
| P2 | Formulario | Contacto `abc` | Error de formato |
| P3 | Formulario | Falla de 5 letras | Error de longitud |
| P4 | Formulario | Datos válidos | Confirmación y solicitud «Recibido» |
| P5 | Navegación | `tecnico` abre `/informe` | Redirige a `/` |
| P6 | Navegación | Sin sesión abre `/tablero` | Redirige a `/login` |
| P7 | Búsqueda/filtro | Buscar «notebook»; filtrar «Entregado» | Solo coincidencias; mensaje si no hay |
| P8 | Operaciones | Avanzar estado | Solo al estado siguiente |
| P9 | Operaciones | Cancelar sin motivo | Se rechaza |
| P10 | Conservación | Recargar la página | Los datos siguen (localStorage) |
| P11 | Permisos | `consulta` | No ve botones de edición |
| P12 | Permisos (base) | `consulta` intenta insertar con Supabase | La política RLS lo rechaza |
| P13 | Tablero | Período sin datos | «Sin datos» y KPI «No calculable», nunca 0 |
| P14 | Informe | Fecha desde posterior a hasta | Mensaje de error |
| P15 | Responsive | Ancho 375 px | Sin desplazamiento horizontal de la página |

**Resultados de la ejecución** (modo simulado, sin Supabase, navegador integrado a unos 800 px de ancho):

| Caso | Resultado | Observación |
|---|---|---|
| P1 | Aprobado | Seis errores, uno por campo |
| P2 | Aprobado | `abc` rechazado; `11 5555-1234` aceptado |
| P3 | Aprobado | «rota» rechazada |
| P4 | Aprobado | Solicitud #23 registrada en «Recibido» |
| P5 | Aprobado | `tecnico` en `/informe` vuelve a `/` y no ve el enlace «Informe» |
| P6 | Aprobado | Sin sesión, `/tablero` redirige a `/login` |
| P7 | Aprobado | Búsqueda «notebook» (4 resultados) y «zzzz» (mensaje vacío); filtro «Entregado»: 14 filas, todas entregadas |
| P8 | Aprobado | Como técnico: #21 Recibido → En diagnóstico; #17 En reparación → Listo (resultado «no reparable») → Entregado, con `entregada_en` guardada |
| P9 | Aprobado | Sin motivo se rechaza; con motivo queda «Cancelado» |
| P10 | Aprobado | Tras recargar, la solicitud cancelada sigue |
| P11 | Aprobado en la interfaz | `tecnico`: sin alta ni «Cancelar». `consulta`: sin alta, sin «Pasar a» y sin «Cancelar». La barrera en la base no se probó (ver P12) |
| P12 | **Aprobado en Supabase real** (15/11/2026) | `npm run test:rls`: 15 de 15 casos con sesión de cada rol (consulta y técnico no escriben lo que no deben, el trigger bloquea saltos de estado, cobro y cancelación del técnico; nadie borra solicitudes ni edita el historial; cada rol ve los perfiles que corresponde). Además se repitió en un Postgres local: 19 casos |
| Ingreso real | Aprobado | Contraseña incorrecta: «Correo o contraseña incorrectos». Con la correcta, el rol sale de la tabla `perfiles` y desaparece la banda de «roles simulados» |
| Alta y avance con datos reales | Aprobado | Como Recepción se registró una solicitud y se avanzó a «En diagnóstico»; el historial guardó los dos pasos con el usuario `recepcion` |
| Tablero e informe con datos reales | Aprobado | Como Administración: 7 reparados, 88 % de éxito y 4,4 días, los mismos valores que en modo simulado; el informe indica «Supabase» como fuente |
| P13 | Aprobado | Con período de 7 días y categoría móvil: «No calculable» con su motivo en éxito y tiempo medio. Sin solicitudes: mensaje de ausencia de datos en tablero e informe |
| P14 | Aprobado | Desde 15/11 y hasta 01/11: mensaje de error, botón de PDF deshabilitado y sin tablas |
| P15 | Aprobado en tablero, informe y solicitudes | A 375 px el ancho de contenido es 375 px: sin desplazamiento horizontal. Ingreso (`/login`) sin medir |

Además, `npm test` ejecuta 9 pruebas automáticas de métricas, validaciones y permisos: **9 aprobadas, 0 fallidas**.
Defectos hallados y corregidos durante la prueba: el tablero decía «1 equipos» (ahora «1 equipo») y mostraba «0 de 0 entregados» junto a un indicador no calculable (ahora se oculta). Observación sin corregir: el texto del buscador se corta en celular.
Los resultados con Supabase real (autenticación y RLS) **no se probaron**.

---

## 8. Conclusiones finales y exposición

### 8.1 Conclusión

**Aprendizajes.** Modelar primero los datos y los permisos simplificó el resto: las historias de usuario salieron directamente de la matriz de roles. Separar la lógica (métricas, validaciones, permisos) de las vistas deja la puerta abierta a probarla sin navegador y a reutilizar los mismos gráficos en tablero e informe.

**Dificultades.** Decidir cómo conservar el historial sin permitir el borrado; sostener la diferencia entre roles simulados y reales; y reconocer que los indicadores ambiental y económico necesitan datos que la v1 no captura.

**Resultados de las pruebas.** Los 15 casos del plan se aprobaron: 14 en modo simulado y P12 (permisos en la base) en Supabase real, con 15 de 15 casos con sesión de cada rol. Las 9 pruebas automáticas de la lógica pasan. Se encontraron y corrigieron dos defectos de redacción en el tablero. Con ingreso real en el navegador se probaron los cuatro roles: Consulta (22 solicitudes, sin alta ni acciones, con Tablero e Informe) y Técnico (sin alta ni «Cancelar», sin enlace a Informe, «Pasar a» en las 7 solicitudes abiertas; al escribir `/informe` a mano vuelve a `/`). **Limitaciones:** el avance de estado con la interfaz real se probó solo con Recepción; con el Técnico se probó con el script contra la base. Las cuentas de prueba usan una contraseña débil y deben reemplazarse antes de cualquier uso real.

**Mejoras pendientes.** Conectar y probar contra Supabase real; completar las vistas del tablero y el informe; consulta del cliente con un código; registro de peso y precio de referencia; stock con alertas; reglamento definitivo.

### 8.2 Estructura sugerida de la exposición (15 minutos)

| Minutos | Contenido | Quién |
|---|---|---|
| 0–2 | Necesidad y presentación de la precooperativa (roles y comisiones) | Presidencia |
| 2–4 | Usuarios y reglamento: qué puede hacer cada rol | Secretaría |
| 4–8 | **Demostración:** ingresar como Recepción, registrar un equipo, avanzar estados, cancelar con motivo | Recepción y Técnico |
| 8–10 | Tablero: filtro de período, indicadores con meta, caso «No calculable» | Tesorería |
| 10–12 | Informe de seguimiento: período, interpretación, guardar como PDF | Sindicatura |
| 12–14 | Decisiones: por qué Supabase, qué es simulado, qué falta | Todo el equipo |
| 14–15 | Preguntas | Todos |

Aclarar en voz alta que los roles y los datos de la demostración son simulados.

---

## 9. Estado real: diseñado, implementado y simulado

| Elemento | Estado |
|---|---|
| Usuarios, historias, pantallas, datos, plan de prueba, cronograma, imprevisto, exposición | **Diseñado** (este documento) |
| `db/schema.sql` (tablas, claves, RLS, trigger) y `db/seed.sql` | **Aplicados y probados en un proyecto Supabase real** (15/11/2026): 15 casos de permisos con sesión de cada rol aprobados; también 19 casos en Postgres local |
| Conexión a Supabase y autenticación | **Implementado y probado** con los cuatro roles en la interfaz |
| Constantes, permisos, validaciones, métricas, capa de datos con localStorage, autenticación, `BarChart.vue` | **Implementado** en `src/` |
| Datos de prueba (22 solicitudes) y roles sin contraseña | **Simulado** |
| Vistas Login, Solicitudes, Tablero e Informe, router con guardias por rol, estilos | **Implementado**, funcionando con datos y roles **simulados** |
| Conexión a Supabase | Código escrito en `data.js` y `auth.js`; **no probado** contra una base real |
| PDF del informe del período | **Generado** en `docs/informe-seguimiento-periodo.pdf` con datos ficticios (período del 16/10 al 15/11/2026) e interpretación redactada a mano; no se revisó visualmente página por página |
| Pruebas automáticas | 9 pruebas, todas aprobadas (`npm test`) |
| Compilación (`npm run build`) | Aprobada |
| Diseño a 375 px | Verificado sin desplazamiento horizontal en tablero, informe y solicitudes |

## 10. Matriz de coherencia

| Necesidad | Servicio | Usuario | Dato | Función del sistema | Indicador |
|---|---|---|---|---|---|
| Reparaciones caras | Reparación a bajo costo | Cliente, Recepción | `solicitudes`, `clientes` | Alta y listado | Equipos reparados |
| Equipos en desuso por fallas menores | Diagnóstico y reparación | Técnico | `estado`, `resultado` | Avance de estados | % de reparaciones exitosas |
| Falta de soporte en la escuela | Mantenimiento de equipos escolares | Escuela como cliente | `tipo` de cliente | Filtro por categoría | Solicitudes por categoría |
| Control y transparencia | Reglamento y rendición de cuentas | Sindicatura | `historial_estados` | Informe, cancelación con historial | Tiempo medio hasta la entrega |
| Basura electrónica | Kits reacondicionados | Tesorería, Recepción | `repuestos` | Stock | Kg recuperados (pendiente) |
