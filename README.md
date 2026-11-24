# Grupo STF: sitio corporativo

Sitio estático (HTML, CSS y JavaScript sin dependencias) del corporativo Grupo STF y sus dos empresas del sector construcción: una fábrica de morteros y una tienda de acabados.

Todos los elementos visuales siguen el **Manual de Marca de Grupo STF, v1.0 (octubre 2026)**:

| Elemento | Aplicación en el sitio |
|---|---|
| Paleta | Azul Medianoche `#0F1B2D`, Marfil `#F4F1EA`, Oro Champán `#B59A6A`; apoyo: Grafito, Pizarra, Oro Profundo y Niebla. Las bandas oscuras y claras se alternan cerca de la proporción 55 / 30 / 10 / 5, y el dorado se usa solo como acento. No se usa blanco puro. |
| Tipografía | Montserrat para titulares (Medium), subtítulos (Light) y cifras; Inter para texto, antetítulos (SemiBold en mayúsculas) y notas de fuente (Light). |
| Logotipo | Versión horizontal positiva en el encabezado (140 px; 132 px en móvil) y negativa en el pie (168 px), sin efectos. Nota: el manual fija 160 px como tamaño mínimo digital; el encabezado quedó por debajo a pedido del cliente. El favicon es el símbolo en negativo sobre Azul Medianoche. |
| Arquitectura de marca | Las empresas aparecen en monocromo y con el mismo peso visual, sin el emblema STF. Su pertenencia se indica solo en el texto legal del pie: «Empresa integrante de Grupo STF». |
| Tono de voz | Trato de «usted», frases breves, sin superlativos, y cifras acompañadas de su fuente. |

## Logotipo

Los archivos de `assets/brand/` se vectorizaron a partir de las láminas del manual, porque el PDF no incluye vectores. **Antes de publicar, reemplácelos por los archivos maestros oficiales**, tal como exige el manual. Use los mismos nombres de archivo:

- `grupo-stf-horizontal.svg`: positivo
- `grupo-stf-horizontal-negativo.svg`: negativo
- `grupo-stf-simbolo.svg`: símbolo
- `favicon.svg`: símbolo en negativo sobre Azul Medianoche

## Contenido que falta completar

- Los nombres y logotipos de las dos empresas, que hoy aparecen entre corchetes.
- Los datos de contacto: dirección, teléfono y correo.
- Las cifras, noticias e indicadores ESG son de ejemplo. Sustitúyalos por datos reales con su fuente.
- Conectar el formulario a un servicio de envío (ver el `TODO` en `js/main.js`).
- Enlazar los documentos reales: reportes, información financiera y Código de Ética.

## Asistente virtual (chatbot)

La página incluye un chat flotante (`js/chat.js` y `css/chat.css`) para que los visitantes pregunten sobre el Grupo, sus empresas y sus vacantes. Las respuestas las genera Claude a través de una Edge Function de Supabase (`supabase/functions/chat`), así la clave de API nunca llega al navegador.

```
Navegador (js/chat.js) ──POST /functions/v1/chat──► Edge Function ──► Claude API
```

### Qué sabe el asistente

Todo está en `supabase/functions/chat/knowledge.ts`. Edite `BUSINESS_INFO` para agregar servicios, horarios, preguntas frecuentes o datos de contacto, y `SYSTEM_PROMPT` para cambiar el tono o las reglas. Lo que no esté ahí, el asistente lo reconoce y canaliza al formulario de contacto. Después de editarlo, vuelva a desplegar la función.

### Puesta en marcha

1. **Secreto con la clave de Claude.** En Supabase → *Edge Functions* → *Secrets*, el secreto debe llamarse `ANTHROPIC_API_KEY` (también se acepta `CLAUDE_API_KEY`). Si ya creó uno con otro nombre, agregue un secreto `ANTHROPIC_KEY_SECRET_NAME` cuyo valor sea ese nombre.
2. **Desplegar la función** (con la [CLI de Supabase](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase login
   supabase link --project-ref TU-PROYECTO
   supabase functions deploy chat --no-verify-jwt
   ```
   `--no-verify-jwt` permite que la usen visitantes sin sesión (ya está fijado en `supabase/config.toml`).
3. **Conectar la página.** En `index.html`, en la etiqueta `<script id="stf-chat">`, reemplace `TU-PROYECTO` en `data-endpoint` por el ID de su proyecto (lo ve en la URL del panel de Supabase).
4. **Restringir el dominio (recomendado).** Agregue el secreto `ALLOWED_ORIGINS` con los dominios donde vive el sitio, separados por coma, p. ej. `https://grupostf.hn,https://sasanfunes.github.io`. Así otros sitios no pueden usar su función.

### Opcional

| Secreto | Para qué |
|---|---|
| `CLAUDE_MODEL` | Cambiar el modelo. Por defecto `claude-haiku-5-5` (rápido y económico). |

### Protecciones incluidas

- La clave solo vive en Supabase.
- Máximo 1 000 caracteres por mensaje, 16 turnos de historial y 400 tokens de respuesta.
- Límite aproximado de 20 mensajes por IP cada 10 minutos.
- Las respuestas se muestran como texto plano (no se inyecta HTML).

Fije también un límite de gasto mensual en Claude Console (*Settings → Limits*).

## Ver en local

```bash
python3 -m http.server 8080
```

## Publicar con GitHub Pages

En Settings → Pages, elija *Deploy from a branch*, seleccione la rama y la carpeta `/ (root)`.
