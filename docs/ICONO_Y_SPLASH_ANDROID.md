# Identidad del paquete instalado

El icono del launcher y el splash del AAB anterior todavía usaban los recursos iniciales de Expo. El logo que se muestra dentro de la app y la imagen configurada en Play Console no sustituyen esos recursos nativos.

app.json referencia ahora ladybarber-icon.png como icono general, icono iOS y logo del splash. El icono adaptable Android usa ladybarber-adaptive-icon.png con fondo azul marino. Ambos PNG de 512 × 512 se reutilizan sin cambios desde los recursos públicos del proyecto web; no se redibujó el logo ni se modificó ese proyecto.

Se retiraron del icono adaptable las referencias al fondo y al monocromo de la plantilla Expo. El icono monocromo personalizado queda sin configurar; la apariencia de iconos temáticos depende del launcher del dispositivo. No se presenta el símbolo Expo como alternativa de marca.

La corrección está en feature/corregir-icono-splash, basada en la entrega frontend 71d6a69, ya integrada en main mediante el PR #36 (ff12e30). Se integra mediante un commit independiente y el flujo habitual feature → develop → release → main antes de generar un nuevo AAB con un versionCode mayor al ya cargado en Play Console. No cambia el identificador del paquete, las credenciales de firma, el backend ni los pagos.

La verificación visual definitiva exige instalar el nuevo paquete firmado y comprobar el icono del launcher y el arranque en frío. Expo Go no reproduce el splash del paquete de producción y no sirve como prueba final de este ajuste. También se debe revisar el recorte del icono en launchers con máscaras diferentes.

Referencias: https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/ y https://docs.expo.dev/versions/v57.0.0/config/app/ . Se recomienda conservar el archivo original de marca de mayor resolución si está disponible; los PNG actuales tienen 512 × 512 píxeles.
