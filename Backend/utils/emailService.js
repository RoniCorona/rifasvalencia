// backend/utils/emailService.js

const nodemailer = require('nodemailer');

// Configura el transporter de Nodemailer
// Usamos variables de entorno para las credenciales por seguridad
const transporter = nodemailer.createTransport({
    service: 'gmail', // Puedes cambiar esto si usas otro proveedor (ej. 'Outlook365')
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Envía un correo electrónico de confirmación de tickets.
 * @param {string} emailTo - Email del comprador.
 * @param {string} nombreComprador - Nombre del comprador.
 * @param {object} rifa - Objeto Rifa.
 * @param {Array} tickets - Array de objetos Ticket comprados.
 */
const sendTicketConfirmationEmail = async (emailTo, nombreComprador, rifa, tickets) => {
    // Asegurarse de que rifa.precioTicketUSD sea un número antes de usar toFixed
    const precioUnitario = typeof rifa.precioTicketUSD === 'number' ? rifa.precioTicketUSD : 0;
    
    // Formatear los números de ticket para el diseño
    const ticketHtmlList = tickets.map(ticket => `
        <span style="
            display: inline-block;
            background-color: #e0f2f7; /* Azul muy claro */
            border: 1px solid #a7d9ed; /* Borde azul suave */
            border-radius: 5px;
            padding: 8px 12px;
            margin: 5px;
            font-family: 'Montserrat', sans-serif;
            font-size: 1.1em;
            font-weight: 600;
            color: #0056b3; /* Azul más oscuro */
            box-shadow: 1px 1px 3px rgba(0,0,0,0.1);
            min-width: 70px;
            text-align: center;
        ">
            🎟️ ${ticket.numeroTicket.toString().padStart(4, '0')}
        </span>
    `).join('');

    const totalAmount = (tickets.length * precioUnitario).toFixed(2); // Calcula el monto total usando precioTicketUSD

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailTo,
        subject: `¡🎉 Boletos Confirmados! Rifa de ${rifa.nombreProducto}`,
        html: `
            <div style="font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f8ff; padding: 20px 0;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    
                    <div style="background-color: #007bff; color: #ffffff; padding: 25px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 2em; font-weight: 700;">¡Gracias por tu Compra!</h1>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="color: #0056b3; margin-top: 0;">¡Hola ${nombreComprador}!</h2>
                        <p style="font-size: 1.1em;">Estamos muy emocionados de que participes en nuestra rifa de **${rifa.nombreProducto}**. ¡Tu apoyo nos impulsa a seguir adelante!</p>
                        <p style="font-size: 1.1em;">Aquí están los detalles de tus boletos reservados:</p>

                        <div style="background-color: #f8fafd; border: 1px solid #e3f2fd; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                            <h3 style="color: #0056b3; margin-top: 0; font-size: 1.3em;">Resumen de tu Compra</h3>
                            <p style="font-size: 1em; margin: 5px 0;"><strong>Rifa:</strong> ${rifa.nombreProducto}</p>
                            <p style="font-size: 1em; margin: 5px 0;"><strong>Cantidad de Tickets:</strong> ${tickets.length}</p>
                            <p style="font-size: 1em; margin: 5px 0;"><strong>Precio por Ticket:</strong> $<span style="font-weight: bold; color: #28a745;">${precioUnitario.toFixed(2)}</span></p>
                            <p style="font-size: 1.2em; margin: 15px 0 0;"><strong>Monto Total Pagado:</strong> $<span style="font-weight: bold; color: #007bff; font-size: 1.3em;">${totalAmount}</span></p>
                        </div>

                        <h3 style="color: #0056b3; text-align: center; margin-top: 30px;">Tus Números de la Suerte:</h3>
                        <div style="text-align: center; margin-bottom: 30px;">
                            ${ticketHtmlList}
                        </div>

                        <p style="font-size: 1.1em;">¡Recuerda que cada ticket es una nueva oportunidad de ganar!</p>
                        <p style="font-size: 1.1em;">Mantente atento a nuestros canales oficiales para el anuncio del sorteo y los resultados.</p>
                        
                        <p style="font-size: 1.15em; margin-top: 30px; text-align: center; font-weight: 600; color: #007bff;">
                            ¡Tu apoyo hace que estas rifas sean posibles! Te invitamos a explorar nuestras próximas rifas y seguir probando tu suerte. ¡Mucha suerte y gracias de nuevo!
                        </p>

                        <p style="font-size: 1.1em; margin-top: 25px;">Con los mejores deseos,</p>
                        <p style="font-size: 1.2em; font-weight: 600; color: #007bff;">El equipo de Modo Rifa</p>
                    </div>

                    <div style="background-color: #f0f8ff; padding: 20px; text-align: center; border-top: 1px solid #e3f2fd; font-size: 0.9em; color: #6c757d;">
                        <p style="margin: 0;">© 2025 Modo Rifa • Todos los derechos reservados.</p>
                        <p style="margin: 5px 0 0;">Este es un mensaje automático, por favor no respondas a esta dirección de correo.</p>
                    </div>

                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo de confirmación enviado a ${emailTo} para la rifa ${rifa.nombreProducto}.`);
    } catch (error) {
        console.error(`Error al enviar correo de confirmación a ${emailTo}:`, error);
        // Puedes lanzar el error de nuevo si quieres que el controlador superior lo maneje
        // throw error; 
    }
};

module.exports = {
    sendTicketConfirmationEmail
};