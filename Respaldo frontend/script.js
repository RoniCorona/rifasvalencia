document.addEventListener('DOMContentLoaded', () => {

    // --- ACTUALIZACIÓN INICIAL DE ESTADO DE RIFAS (NUEVO) ---
    // Selecciona todas las tarjetas de rifa
    const rifaCards = document.querySelectorAll('.rifa-card');

    rifaCards.forEach(card => {
        const dataRaffle = card.dataset.raffle; // Obtiene el valor de data-raffle (ej. "tv50", "iphone14")
        const progresoDiv = card.querySelector('.progreso');
        const barraProgreso = card.querySelector('.barra-progreso');
        const botonComprar = card.querySelector(`#comprar-${dataRaffle}`); // Selecciona el botón por su ID

        // Asegúrate de que todos los elementos existan antes de intentar manipularlos
        if (progresoDiv && barraProgreso && botonComprar) {
            // Extrae el porcentaje vendido del texto del div .progreso
            // Usa una expresión regular para encontrar el número
            const porcentajeTexto = progresoDiv.textContent;
            const match = porcentajeTexto.match(/(\d+) % vendido/); // Busca un número seguido de " % vendido"
            let porcentajeVendido = 0;

            if (match && match[1]) {
                porcentajeVendido = parseInt(match[1], 10);
            } else {
                // Si no se encuentra en el texto, intenta sacarlo del style de la barra de progreso
                const widthStyle = barraProgreso.style.width;
                if (widthStyle) {
                    porcentajeVendido = parseFloat(widthStyle);
                }
            }

            // Actualiza la barra visualmente (aunque ya venga del HTML, es bueno confirmarlo)
            barraProgreso.style.width = `${porcentajeVendido}%`;

            // Lógica para cambiar el botón si la rifa está 100% vendida
            if (porcentajeVendido >= 100) {
                botonComprar.textContent = "¡Rifa Cerrada!"; // O "Esperando resultados"
                botonComprar.setAttribute('disabled', 'true'); // Deshabilita el enlace
                botonComprar.removeAttribute('href'); // Quita el href para que no sea clicable

                // Puedes añadir o quitar clases CSS aquí para cambiar su estilo
                // Ejemplo: botonComprar.classList.add('btn-inactivo');
            } else {
                // Asegúrate de que el botón esté activo si el porcentaje es menor a 100
                botonComprar.textContent = "Comprar Números";
                botonComprar.removeAttribute('disabled');
                // Restaura el href original si lo habías quitado. Si el href es estático, puedes omitir esta línea
                // botonComprar.setAttribute('href', 'rifa.html');
            }
        }
    });

    // --- FIN ACTUALIZACIÓN INICIAL DE ESTADO DE RIFAS (NUEVO) ---

    // === CONTROL DE TICKETS (Funcionalidad de cantidad de boletos) ===
    const inputCantidad = document.getElementById("cantidadTickets");
    const btnSumar = document.getElementById("sumar");
    const btnRestar = document.getElementById("restar");
    const botonesRapidos = document.querySelectorAll(".botones-cantidad-rapida button");

    if (inputCantidad && btnSumar && btnRestar) {
        btnSumar.addEventListener("click", () => {
            inputCantidad.value = Number(inputCantidad.value) + 1;
        });

        btnRestar.addEventListener("click", () => {
            const actual = Number(inputCantidad.value);
            if (actual > 1) inputCantidad.value = actual - 1;
        });

        inputCantidad.addEventListener("input", () => {
            let valor = parseInt(inputCantidad.value);
            if (isNaN(valor) || valor < 1) inputCantidad.value = 1;
        });

        botonesRapidos.forEach(btn => {
            btn.addEventListener("click", () => {
                inputCantidad.value = btn.dataset.val;
            });
        });
    }


    // === NAVEGACIÓN ENTRE SECCIONES (Compra y Pago) ===
    const formUsuario = document.querySelector(".formulario-usuario");
    const seccionCompra = document.querySelector(".seccion-compra");
    const seccionPago = document.getElementById("seccion-pago");
    const atrasMetodoBtn = document.getElementById("atrasMetodo");

    // Verificar que los elementos existan antes de añadir event listeners
    if (formUsuario && seccionCompra && seccionPago) {
        formUsuario.addEventListener("submit", (e) => {
            e.preventDefault(); // Evita el envío tradicional del formulario
            seccionCompra.classList.add("oculto");
            seccionPago.classList.remove("oculto");
        });
    }

    if (atrasMetodoBtn && seccionPago && seccionCompra) {
        atrasMetodoBtn.addEventListener("click", () => {
            seccionPago.classList.add("oculto");
            seccionCompra.classList.remove("oculto");
        });
    }


    // === MÉTODO DE PAGO DINÁMICO (Binance / Pago Móvil) ===
    const btnBinance = document.getElementById("pagoBinance");
    const btnPagoMovil = document.getElementById("pagoMovil");
    const detallesPago = document.getElementById("detalles-pago");

    if (btnBinance && btnPagoMovil && detallesPago && inputCantidad) { // Asegúrate de que todos los elementos necesarios existan
        function limpiarSeleccion() {
            [btnBinance, btnPagoMovil].forEach(btn => btn.classList.remove("seleccionado"));
            detallesPago.innerHTML = "";
            detallesPago.classList.add("oculto");
        }

        function mostrarDetalles(metodo, cantidad) {
            const precioUSD = 2.5; // Valor de ejemplo
            const tasaBCV = 38.5; // Valor de ejemplo, actualiza si es necesario
            const totalUSD = cantidad * precioUSD;
            const totalBs = totalUSD * tasaBCV;

            let html = "";

            if (metodo === "binance") {
                html += `
                    <h4>Pago vía Binance</h4>
                    <p><strong>Usuario:</strong> ronidev.bnb</p>
                    <p><strong>Red:</strong> BSC (BEP-20)</p>
                    <p><strong>Monto a pagar:</strong> $${totalUSD.toFixed(2)}</p>
                    <label>Sube tu comprobante de pago:</label>
                    <input type="file" accept="image/*,application/pdf" required />
                `;
            } else if (metodo === "pagomovil") {
                html += `
                    <h4>Pago Móvil</h4>
                    <p><strong>Banco:</strong> Banesco</p>
                    <p><strong>Teléfono:</strong> 0412-1234567</p>
                    <p><strong>CI:</strong> V-12345678</p>
                    <p><strong>Nombre:</strong> Roni Dev</p>
                    <p><strong>Monto a pagar:</strong> ${totalBs.toFixed(2)} Bs</p>
                    <label>Últimos 6 dígitos de la referencia bancaria:</label>
                    <input type="text" maxlength="6" pattern="\\d{6}" required />
                `;
            }

            detallesPago.innerHTML = html;
            detallesPago.classList.remove("oculto");
        }

        btnBinance.addEventListener("click", () => {
            limpiarSeleccion();
            btnBinance.classList.add("seleccionado");
            mostrarDetalles("binance", Number(inputCantidad.value));
        });

        btnPagoMovil.addEventListener("click", () => {
            limpiarSeleccion();
            btnPagoMovil.classList.add("seleccionado");
            mostrarDetalles("pagomovil", Number(inputCantidad.value));
        });
    }


    // === VISTA PREVIA DE COMPROBANTE ===
    const detallesPagoSection = document.getElementById("detalles-pago"); // Re-obtenerlo si es necesario, o usar la constante anterior
    if (detallesPagoSection) {
        detallesPagoSection.addEventListener("change", (e) => {
            if (e.target.type === "file") {
                const file = e.target.files[0];
                const vistaPrevia = document.createElement("div");
                vistaPrevia.classList.add("vista-previa");

                if (file && file.type.startsWith("image/")) {
                    const img = document.createElement("img");
                    img.src = URL.createObjectURL(file);
                    vistaPrevia.innerHTML = "<strong>Vista previa del comprobante:</strong>";
                    vistaPrevia.appendChild(img);
                } else if (file) {
                    vistaPrevia.innerHTML = `<p class="mensaje-error">⚠️ El archivo seleccionado no es una imagen.</p>`;
                }

                const previaExistente = detallesPagoSection.querySelector(".vista-previa");
                if (previaExistente) previaExistente.remove();

                detallesPagoSection.appendChild(vistaPrevia);
            }
        });
    }


    // === FINALIZAR COMPRA → RESUMEN + BOLETOS ALEATORIOS ===
    const siguienteMetodoBtn = document.getElementById("siguienteMetodo");
    const seccionFinal = document.getElementById("seccion-final");
    const nombreConfirmacion = document.getElementById("nombreConfirmacion");
    const datoNombre = document.getElementById("datoNombre");
    const datoCorreo = document.getElementById("datoCorreo");
    const datoTelefono = document.getElementById("datoTelefono");
    const datoMetodo = document.getElementById("datoMetodo");
    const datoCantidad = document.getElementById("datoCantidad");
    const boletosAsignadosContenedor = document.getElementById("boletosAsignados");

    // Asegúrate de que todos los elementos cruciales existan antes de añadir el listener
    if (siguienteMetodoBtn && seccionPago && seccionFinal && nombreConfirmacion && datoNombre && datoCorreo && datoTelefono && datoMetodo && datoCantidad && boletosAsignadosContenedor && inputCantidad) {
        siguienteMetodoBtn.addEventListener("click", () => {
            const cantidad = Number(inputCantidad.value);
            const metodo = btnBinance.classList.contains("seleccionado") ? "Binance" : "Pago Móvil"; // Asume que btnBinance está definido
            const nombreInput = document.querySelector(".formulario-usuario input[name='nombre']"); // Usar name en lugar de type para más robustez
            const telefonoInput = document.querySelector(".formulario-usuario input[name='telefono']");
            const correoInput = document.querySelector(".formulario-usuario input[name='correo']");

            // Verifica si los inputs existen antes de acceder a su valor
            const nombre = nombreInput ? nombreInput.value : '';
            const telefono = telefonoInput ? telefonoInput.value : '';
            const correo = correoInput ? correoInput.value : '';

            seccionPago.classList.add("oculto");
            seccionFinal.classList.remove("oculto");

            nombreConfirmacion.textContent = nombre;
            datoNombre.textContent = nombre;
            datoCorreo.textContent = correo;
            datoTelefono.textContent = telefono;
            datoMetodo.textContent = metodo;
            datoCantidad.textContent = cantidad;

            // Limpiar boletos anteriores si los hubiera
            boletosAsignadosContenedor.innerHTML = '';

            const boletos = new Set();
            while (boletos.size < cantidad) {
                let num = Math.floor(Math.random() * 10000) + 1;
                let formato = num.toString().padStart(4, '0');
                boletos.add(formato);
            }

            boletos.forEach(boleto => {
                const tarjeta = document.createElement("div");
                tarjeta.className = "boleto";
                tarjeta.textContent = `🎟️ ${boleto}`;
                boletosAsignadosContenedor.appendChild(tarjeta);
            });
        });
    }


    // === REDIRECCIÓN DE BOTÓN DE COMPRAR NÚMEROS A PÁGINA DE RIFAS ===
    // Este código ahora debe tener un manejo adicional para el estado 'disabled'
    document.querySelectorAll(".btn-comprar").forEach(btn => {
        btn.addEventListener("click", e => {
            // Si el botón está deshabilitado por JavaScript, no hacemos nada
            if (e.target.hasAttribute('disabled')) {
                e.preventDefault(); // Previene cualquier acción por defecto del enlace
                return; // Sale de la función
            }

            const rifaCard = e.target.closest(".rifa-card");
            if (rifaCard) {
                const rifaId = rifaCard.dataset.raffle;
                // Asegúrate de que el dataset-raffle esté definido en tu HTML para la rifa-card
                if (rifaId) {
                    // Esta línea se ejecuta solo si el botón NO está deshabilitado
                    location.href = `rifa-${rifaId}.html`;
                } else {
                    console.warn("La tarjeta de rifa no tiene el atributo data-raffle.", rifaCard);
                }
            }
        });
    });


    // --- Lógica para el Modal de Consulta de Tickets ---
    // Seleccionamos TODOS los botones con la clase 'js-abrir-modal-tickets'
    const btnsVerTickets = document.querySelectorAll('.js-abrir-modal-tickets');
    const modalTickets = document.getElementById('modalTickets');
    const cerrarModalBtn = document.querySelector('.cerrar-modal');
    const formConsultarTickets = document.getElementById('formConsultarTickets');
    const correoConsultaInput = document.getElementById('correoConsulta');
    const resultadosConsultaDiv = document.getElementById('resultados-consulta-tickets');

    // --- Funciones del Modal de Consulta ---
    function abrirModalTickets() {
        if (modalTickets) { // Solo si el modal existe
            modalTickets.classList.remove('oculto');
        }
    }

    function cerrarModalTickets() {
        if (modalTickets) { // Solo si el modal existe
            modalTickets.classList.add('oculto');
            // Opcional: Limpiar el campo de correo y los resultados al cerrar
            if (correoConsultaInput) correoConsultaInput.value = '';
            if (resultadosConsultaDiv) resultadosConsultaDiv.innerHTML = '';
        }
    }

    // --- Event Listeners para el Modal de Consulta ---

    // Abre el modal al hacer click en CUALQUIER botón "Ver Tickets"
    if (btnsVerTickets.length > 0) {
        btnsVerTickets.forEach(button => {
            button.addEventListener('click', abrirModalTickets);
        });
    } else {
        // Esta advertencia es útil durante el desarrollo si olvidas añadir la clase
        console.warn("No se encontraron botones con la clase 'js-abrir-modal-tickets'. Asegúrate de añadir esta clase a tus botones 'Ver Tickets'.");
    }

    // Cierra el modal al hacer click en la "X"
    if (cerrarModalBtn) {
        cerrarModalBtn.addEventListener('click', cerrarModalTickets);
    }


    // Cierra el modal si se clickea fuera del contenido del modal
    if (modalTickets) {
        window.addEventListener('click', (event) => {
            if (event.target === modalTickets) { // Usar '===' para una comparación estricta
                cerrarModalTickets();
            }
        });
    }


    // Maneja el envío del formulario de consulta
    if (formConsultarTickets) {
        formConsultarTickets.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita que el formulario se recargue la página

            const correo = correoConsultaInput ? correoConsultaInput.value : ''; // Asegura que input exista
            if (resultadosConsultaDiv) {
                if (correo) { // Solo si hay un correo
                    resultadosConsultaDiv.innerHTML = `<p>Buscando tickets para: <strong>${correo}</strong>...</p>`;
                } else {
                    resultadosConsultaDiv.innerHTML = `<p style="color: crimson;">Por favor, ingresa un correo electrónico.</p>`;
                }
            }

            // --- Aquí es donde integrarías tu lógica de backend para consultar tickets ---
            // Esto es solo un placeholder simulado, ¡necesitas tu propio backend!
            setTimeout(() => {
                if (correo && correo.includes('@') && correo.length > 5) { // Una validación básica
                    if (resultadosConsultaDiv) {
                        resultadosConsultaDiv.innerHTML = `
                            <p><strong>Tickets encontrados para ${correo}:</strong></p>
                            <ul>
                                <li>Rifa TV Smart 50": #123, #456</li>
                                <li>Rifa iPhone 14: #789</li>
                            </ul>
                            <p>Estos son ejemplos. La información real vendría de tu servidor.</p>
                        `;
                    }
                } else {
                    if (resultadosConsultaDiv) {
                        resultadosConsultaDiv.innerHTML = `<p style="color: crimson;">Por favor, ingresa un correo electrónico válido.</p>`;
                    }
                }
            }, 1500); // Simula 1.5 segundos de "carga"
        });
    }

}); // Fin de DOMContentLoaded