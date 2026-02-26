import type { TranslationMessages } from "./en";

export const esMessages: TranslationMessages = {
  "app.skip_to_main_content": "Saltar al contenido principal",
  "base.powered_by": "Desarrollado por",
  "base.privacy_policy": "Política de privacidad",
  "hero.continue": "Continuar",
  "main.form_not_found.title": "Formulario no encontrado",
  "main.form_not_found.description":
    "El formulario que buscas no existe o fue eliminado.",
  "main.form_not_yet_open.title": "Formulario aún no abierto",
  "main.form_not_yet_open.description":
    "Este formulario aún no acepta envíos.",
  "main.form_closed.title": "Formulario cerrado",
  "main.form_closed.description": "Este formulario ya no acepta envíos.",
  "thank_you.page_title": "Gracias — Declarative Forms",
  "thank_you.default_title": "¡Gracias!",
  "thank_you.default_description": "Hemos recibido tu envío.",
  "section.back": "Atrás",
  "section.next": "Siguiente",
  "dropdown.select_a": "Selecciona {label}",
  "dropdown.search": "Buscar...",
  "dropdown.no_results": "No se encontraron resultados.",
  "input.placeholder": "Tu respuesta",
  "long_text.placeholder": "Tu respuesta",
  "address.placeholder": "Introduce una dirección",
  "address.loading_suggestions": "Cargando sugerencias",
  "address.no_results": "No se encontraron resultados.",
  "email.placeholder_default": "Tu respuesta",
  "email.placeholder_otp": "tu@email.com",
  "email.otp.invalid_email_before_send":
    "Introduce un correo válido antes de solicitar un código.",
  "email.otp.send_failed": "No se pudo enviar el código de verificación.",
  "email.otp.request_code_first": "Solicita primero un código de verificación.",
  "email.otp.enter_code": "Introduce el código de verificación.",
  "email.otp.invalid_code": "Código de verificación no válido.",
  "email.otp.verification_code_placeholder": "Introduce el código de 6 dígitos",
  "email.otp.verification_code_aria_label": "Código de verificación",
  "email.otp.send_code": "Enviar código",
  "email.otp.resend": "Reenviar",
  "email.otp.resend_in_seconds": "Reenviar en {seconds}s",
  "email.otp.verify": "Verificar",
  "email.otp.request_failed": "La solicitud falló. Inténtalo de nuevo.",
  "email.otp.start_failed": "No se pudo iniciar la verificación OTP.",
  "email.otp.token_missing":
    "Falta el token de verificación OTP en la respuesta.",
  "connections.success_title": "Éxito",
  "connections.success_description":
    "Tu conexión se creó correctamente. Usa el ID de abajo en tu configuración YAML.",
  "connections.connection_id": "ID de conexión",
  "connections.helper":
    "Este ID conecta tu formulario con Airtable, GitHub o Google Sheets.",
  "cookie.message": "Usamos cookies para mejorar tu experiencia.",
  "cookie.learn_more": "Más información",
  "cookie.decline": "Rechazar",
  "cookie.accept": "Aceptar",
  "privacy_policy.title": "Política de privacidad",
  "privacy_policy.back_home": "Volver al inicio",
  "geolocation.use_my_location": "Usar mi ubicación",
  "geolocation.loading": "Obteniendo ubicación...",
  "geolocation.clear": "Borrar",
  "geolocation.try_again": "Intentar de nuevo",
  "geolocation.location_captured": "Ubicación capturada exitosamente.",
  "geolocation.map_label": "Mapa mostrando tu ubicación capturada",
  "geolocation.accuracy_very_precise": "Muy precisa",
  "geolocation.accuracy_precise": "Precisa",
  "geolocation.accuracy_approximate": "Aproximada",
  "geolocation.accuracy_less_accurate": "Menos precisa",
  "geolocation.error_permission_denied":
    "Se denegó el acceso a la ubicación. Habilita los permisos de ubicación en la configuración de tu navegador.",
  "geolocation.error_position_unavailable":
    "No se pudo determinar tu ubicación. Inténtalo de nuevo.",
  "geolocation.error_timeout":
    "La solicitud de ubicación expiró. Inténtalo de nuevo.",
  "geolocation.error_not_supported":
    "La geolocalización no es compatible con tu navegador.",
  "validation.required": "{label} es obligatorio.",
  "validation.invalid": "{label} no es válido.",
  "validation.min_length":
    "{label} debe tener al menos {min} caracteres.",
  "validation.max_length":
    "{label} debe tener como máximo {max} caracteres.",
  "validation.email_otp_required":
    "Por favor, verifica tu correo electrónico con OTP.",
  "validation.date_min":
    "{label} debe ser en o después de {min}.",
  "validation.date_max":
    "{label} debe ser en o antes de {max}.",
  "validation.whole_number": "{label} debe ser un número entero.",
  "validation.number_min": "{label} debe ser al menos {min}.",
  "validation.number_max": "{label} debe ser como máximo {max}.",
  "validation.file_min":
    "{label} requiere al menos {min} archivo(s).",
  "validation.file_max":
    "{label} permite como máximo {max} archivo(s).",
  "validation.selection_min":
    "{label} requiere al menos {min} selección(es).",
  "validation.selection_max":
    "{label} permite como máximo {max} selección(es).",
  "file_upload.click_to_upload":
    "Haz clic para subir o arrastra y suelta",
  "file_upload.upload_files": "Subir archivos",
  "file_upload.uploaded_files": "Archivos subidos",
  "file_upload.range_files": "{min}-{max} archivos",
  "file_upload.at_least_files":
    "Al menos {min} archivo(s)",
  "file_upload.up_to_files": "Hasta {max} archivos",
  "file_upload.max_reached":
    "Número máximo de archivos ({max}) alcanzado",
  "file_upload.upload_failed": "Error al subir",
  "file_upload.uploading": "Subiendo",
  "file_upload.remove_file": "Eliminar {name}",
  "signature.draw": "Dibuja tu firma",
  "signature.uploading": "Subiendo...",
  "signature.capture_failed": "No se pudo capturar la firma.",
  "signature.upload_failed": "Error al subir",
  "signature.clear": "Borrar",
  "multiple_select.range":
    "Selecciona {min}-{max} opciones",
  "multiple_select.at_least":
    "Selecciona al menos {min} opción(es)",
  "multiple_select.up_to":
    "Selecciona hasta {max} opciones",
  "multiple_select.selected_count": "{count} seleccionados",
};
