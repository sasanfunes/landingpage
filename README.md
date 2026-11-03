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

## Ver en local

```bash
python3 -m http.server 8080
```

## Publicar con GitHub Pages

En Settings → Pages, elija *Deploy from a branch*, seleccione la rama y la carpeta `/ (root)`.
