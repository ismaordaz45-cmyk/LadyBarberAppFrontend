export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const LEGAL_LAST_UPDATED = '9 de noviembre de 2026';
export const PRIVACY_CONTACT_EMAIL = 'itzadinorasaenzhernandez@gmail.com';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Responsable y alcance',
    paragraphs: [
      "Salón Lady Barber Itza D'M es responsable del tratamiento de los datos personales utilizados por LadyBarberApp. Esta política aplica al registro, inicio de sesión, recuperación de acceso, perfil, consulta de catálogos, citas y pagos de servicios físicos disponibles en la aplicación.",
      `Para consultas de privacidad puedes escribir a ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
  {
    title: '2. Datos que tratamos',
    bullets: [
      'Nombre, apellidos, correo electrónico, teléfono opcional e identificador interno de usuario.',
      'Credenciales protegidas mediante hash y datos opcionales de recuperación de cuenta.',
      'Información de perfil, citas, servicios seleccionados y estados de atención.',
      'Datos operativos de pagos y transacciones cuando eliges pagar un servicio físico. LadyBarberApp no solicita ni almacena directamente los datos completos de tu tarjeta.',
    ],
  },
  {
    title: '3. Finalidades',
    bullets: [
      'Crear y proteger tu cuenta, autenticarte y recuperar el acceso.',
      'Mostrar y actualizar tu perfil de cliente.',
      'Consultar servicios y productos, reservar citas y administrar su estado.',
      'Procesar anticipos de servicios físicos y atender aclaraciones cuando esa función esté disponible.',
      'Enviar mensajes operativos relacionados con acceso, citas o seguridad de la cuenta.',
    ],
  },
  {
    title: '4. Proveedores que intervienen',
    paragraphs: [
      'Usamos proveedores tecnológicos únicamente para operar el servicio: Render para alojar la API, Hostinger para la base de datos, Brevo para correos operativos y Mercado Pago cuando eliges realizar un pago. Cada proveedor procesa solo la información necesaria para su función y conforme a sus propias políticas.',
      'No vendemos tus datos personales ni los utilizamos para publicidad de terceros.',
    ],
  },
  {
    title: '5. Seguridad',
    paragraphs: [
      'La aplicación se comunica con la API mediante HTTPS. Las contraseñas no se almacenan en texto legible y las operaciones privadas requieren autenticación. Ningún sistema es completamente infalible, pero aplicamos medidas técnicas y organizativas razonables para reducir accesos no autorizados.',
    ],
  },
  {
    title: '6. Conservación y eliminación',
    paragraphs: [
      'Conservamos los datos mientras la cuenta permanece activa y durante los periodos necesarios para operar citas, atender obligaciones legales, contables o resolver controversias.',
      'Puedes eliminar tu cuenta desde Mi Perfil. Al confirmar con tu contraseña, se revoca el acceso y se eliminan o anonimizan los datos personales vinculados. Algunos registros de citas o transacciones pueden conservarse de forma anonimizada cuando exista una obligación legítima, sin permitir identificarte directamente.',
      `Si no tienes instalada la aplicación, puedes iniciar una solicitud desde la página pública de eliminación de cuenta o escribir a ${PRIVACY_CONTACT_EMAIL}. Nunca envíes tu contraseña, tokens, códigos de recuperación ni datos bancarios por correo.`,
    ],
  },
  {
    title: '7. Tus derechos',
    paragraphs: [
      `Puedes solicitar acceso, rectificación, oposición o información sobre la eliminación escribiendo a ${PRIVACY_CONTACT_EMAIL}. Para proteger tu cuenta podremos pedir una verificación razonable de identidad.`,
    ],
  },
  {
    title: '8. Edad mínima',
    paragraphs: [
      'LadyBarberApp está dirigida exclusivamente a personas mayores de 18 años. Al crear una cuenta declaras cumplir esta condición.',
    ],
  },
  {
    title: '9. Cambios a esta política',
    paragraphs: [
      'Podemos actualizar esta política cuando cambien las funciones o proveedores. Mostraremos la fecha de la versión vigente y comunicaremos los cambios relevantes por medios razonables.',
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Aceptación y edad mínima',
    paragraphs: [
      "Estos términos regulan el uso de LadyBarberApp y los servicios físicos de Salón Lady Barber Itza D'M. Para crear una cuenta debes ser mayor de 18 años y aceptar estos términos junto con la Política de privacidad.",
    ],
  },
  {
    title: '2. Cuenta y seguridad',
    bullets: [
      'Debes proporcionar información correcta y mantenerla actualizada.',
      'Eres responsable de proteger tu contraseña y avisar si detectas un acceso no autorizado.',
      'Podemos restringir cuentas utilizadas de manera fraudulenta, ilegal o contraria a estos términos.',
    ],
  },
  {
    title: '3. Citas y disponibilidad',
    paragraphs: [
      'Las citas dependen de horarios, personal y servicios disponibles. La aplicación muestra las condiciones de anticipación, confirmación, cancelación y anticipo antes de completar la reserva.',
      'Debes revisar fecha, hora, servicios, precio y políticas de cancelación antes de confirmar.',
    ],
  },
  {
    title: '4. Pagos de servicios físicos',
    paragraphs: [
      'Cuando el pago esté habilitado, Mercado Pago procesará el anticipo del servicio físico. LadyBarberApp no vende contenido digital ni funciones virtuales. Los importes se muestran en pesos mexicanos antes de continuar.',
      'Las devoluciones o aclaraciones se resolverán conforme a la política mostrada al reservar y a la legislación aplicable.',
    ],
  },
  {
    title: '5. Catálogo de productos',
    paragraphs: [
      'El catálogo móvil es informativo. Los precios, imágenes y existencias pueden actualizarse. La versión 0.1.0 no permite comprar productos desde la aplicación.',
    ],
  },
  {
    title: '6. Uso permitido',
    bullets: [
      'No debes interferir con la aplicación, intentar acceder a cuentas ajenas ni utilizarla con fines ilícitos.',
      'Las imágenes, marcas y contenidos pertenecen a sus respectivos titulares y no pueden reutilizarse sin autorización.',
    ],
  },
  {
    title: '7. Eliminación de cuenta',
    paragraphs: [
      'Puedes eliminar tu cuenta desde Mi Perfil. La operación es permanente, cancela el acceso y elimina o anonimiza los datos personales conforme a la Política de privacidad y las obligaciones de conservación aplicables.',
    ],
  },
  {
    title: '8. Disponibilidad y responsabilidad',
    paragraphs: [
      'Podemos realizar mantenimiento o experimentar interrupciones temporales. Procuraremos mantener la información actualizada, pero la disponibilidad final de horarios y productos depende de la operación del salón.',
    ],
  },
  {
    title: '9. Contacto y cambios',
    paragraphs: [
      `Para dudas escribe a ${PRIVACY_CONTACT_EMAIL}. Podemos actualizar estos términos y mostraremos la fecha de la versión vigente dentro de la aplicación.`,
    ],
  },
];
