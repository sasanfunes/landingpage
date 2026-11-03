# Grupo Valmora — Landing page corporativa

Sitio estático (HTML, CSS y JavaScript sin dependencias) para un grupo de la construcción con dos unidades de negocio:

- **Valmora Morteros**: fábrica de morteros industriales.
- **Valmora Acabados**: red de tiendas de acabados.

> "Grupo Valmora", las cifras, direcciones y noticias son contenido de ejemplo. Reemplázalos por los datos reales de la empresa.

## Secciones

1. Barra utilitaria (inversionistas, proveedores, empleo, idioma)
2. Encabezado fijo con navegación y menú móvil
3. Hero con corte constructivo del muro y cifras clave
4. El Grupo: historia, misión, visión y valores
5. Unidades de negocio
6. Modelo integrado (cadena de valor)
7. Sostenibilidad / ESG y gobierno corporativo
8. Calidad e innovación (certificaciones)
9. Presencia (planta, centros de distribución, showrooms)
10. Sala de prensa
11. Trabaja con nosotros
12. Contacto con formulario validado
13. Pie con enlaces corporativos, legales y redes

## Estructura

```
index.html
css/styles.css   # tokens de diseño al inicio (colores, tipografías, espaciado)
js/main.js       # menú, scroll, contadores, validación del formulario
assets/favicon.svg
```

## Ver en local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8080
```

## Publicar con GitHub Pages

Settings → Pages → *Deploy from a branch* → elige la rama y la carpeta `/ (root)`.

## Pendientes para producción

- Conectar el formulario a un backend o servicio (ver `TODO` en `js/main.js`).
- Sustituir los ilustrados por fotografía real de planta y showrooms si se desea.
- Enlazar los documentos reales (reporte de sostenibilidad, fichas técnicas, código de ética).
