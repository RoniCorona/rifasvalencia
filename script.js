// script.js

// --- 1. CONFIGURACIÓN BASE: URL de tu API Backend ---
const API_URL = '/api'; // <--- ¡ASEGÚRATE DE QUE ESTA URL SEA LA CORRECTA PARA TU BACKEND!

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA MODAL DE TÉRMINOS Y CONDICIONES ---
    const modalTerminos = document.getElementById('modalTerminos');
    const btnAceptarTerminos = document.getElementById('btnAceptarTerminos');
    const btnRechazarTerminos = document.getElementById('btnRechazarTerminos');

    // Referencia a la sección de compra que debe estar oculta hasta aceptar términos
    const seccionCompra = document.querySelector(".seccion-compra");

    // DECLARACIÓN DE formUsuario AQUÍ PARA EVITAR EL ERROR "NOT DEFINED"
    const formUsuario = document.querySelector(".formulario-usuario");

    if (modalTerminos) {
        if (window.location.pathname.includes('rifa.html')) {
            modalTerminos.classList.remove('oculto');
            if (seccionCompra) seccionCompra.classList.add('oculto');
        } else {
            modalTerminos.classList.add('oculto');
        }
    }

    if (btnAceptarTerminos) {
        btnAceptarTerminos.addEventListener('click', () => {
            modalTerminos.classList.add('oculto');
            if (seccionCompra) seccionCompra.classList.remove('oculto');
        });
    }

    if (btnRechazarTerminos) {
        btnRechazarTerminos.addEventListener('click', () => {
            alert('Debes aceptar los términos y condiciones para participar en esta rifa.');
            window.location.href = 'index.html';
        });
    }
    // --- FIN LÓGICA MODAL ---

    // --- FUNCIONES UTILITY ---
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Variable para almacenar el ID del temporizador de mensajes
    let messageTimeoutId;

    function showMessage(message, type = 'success') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            const mainContainer = document.querySelector('main');
            if (mainContainer) {
                const tempMessageDiv = document.createElement('div');
                tempMessageDiv.id = 'temp-message-container';
                tempMessageDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
                mainContainer.prepend(tempMessageDiv);
                setTimeout(() => {
                    tempMessageDiv.remove();
                }, 5000);
            } else {
                console.error('Contenedor de mensajes no encontrado y main tampoco para temporal.', message);
            }
            return;
        }

        // Limpia cualquier temporizador anterior
        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
        }

        messageContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        messageContainer.classList.remove('oculto');
        // Asegúrate de que las clases de éxito/error se apliquen antes de remover 'oculto'
        messageContainer.classList.remove('success', 'error', 'info'); // Limpia clases anteriores
        messageContainer.classList.add(type); // Añade la clase correcta

        messageTimeoutId = setTimeout(() => {
            messageContainer.classList.add('oculto');
            messageContainer.innerHTML = '';
            messageContainer.classList.remove('success', 'error', 'info'); // Limpia clases al ocultar
        }, 5000);
    }

    // --- CARGA DINÁMICA DE RIFAS EN index.html ---
    const contenedorRifas = document.getElementById('contenedorRifas');

    if (contenedorRifas) {
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            async function fetchAllRifas() {
                try {
                    contenedorRifas.innerHTML = '<p>Cargando rifas...</p>';
                    const response = await fetch(`${API_URL}/rifas`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const rifas = await response.json();

                    if (rifas.length === 0) {
                        contenedorRifas.innerHTML = '<p>No hay rifas disponibles en este momento.</p>';
                        return;
                    }

                    rifas.sort((a, b) => {
                        const dateA = new Date(a.fechaCreacion || a.createdAt);
                        const dateB = new Date(b.fechaCreacion || b.createdAt);
                        return dateB - dateA;
                    });

                    contenedorRifas.innerHTML = '';

                    rifas.forEach(rifa => {
                        const porcentajeVendido = rifa.totalTickets > 0 ? (rifa.ticketsVendidos / rifa.totalTickets) * 100 : 0;
                        let estadoBoton = 'Comprar Números';
                        let isDisabled = '';
                        let hrefLink = `rifa.html?id=${rifa._id}`;

                        if (rifa.ticketsVendidos >= rifa.totalTickets) {
                            estadoBoton = '¡Rifa Agotada!';
                            isDisabled = 'disabled';
                            hrefLink = '#';
                        } else if (rifa.estado === 'pausada') {
                            estadoBoton = 'Rifa Pausada';
                            isDisabled = 'disabled';
                            hrefLink = '#';
                        } else if (rifa.estado === 'finalizada' || rifa.estado === 'sorteada') {
                            estadoBoton = 'Rifa Finalizada';
                            isDisabled = 'disabled';
                            hrefLink = '#';
                        } else if (rifa.estaAbiertaParaVenta === false) {
                            estadoBoton = 'Rifa Cerrada';
                            isDisabled = 'disabled';
                            hrefLink = '#';
                        }

                        const rifaCard = document.createElement('div');
                        rifaCard.className = 'rifa-card';
                        rifaCard.dataset.raffle = rifa._id;

                        rifaCard.innerHTML = `
                            <div class="header-card-info">
                                <div class="progreso">🎯 ${porcentajeVendido.toFixed(0)} % vendido</div>
                                <div class="barra-container">
                                    <div class="barra-progreso" style="width:${porcentajeVendido}%"></div>
                                </div>
                                <h3 class="titulo-producto-rifa">${rifa.nombreProducto}</h3>
                            </div>
                            <div class="imagen-rifa">
                                <img src="${rifa.imagenUrl}" alt="${rifa.nombreProducto}">
                            </div>
                            <div class="acciones">
                                <a href="${hrefLink}" class="btn-comprar" id="comprar-${rifa._id}" data-raffle-id="${rifa._id}" ${isDisabled}>${estadoBoton}</a>
                                <button class="ver-tickets js-abrir-modal-tickets" data-rifa-id="${rifa._id}">Ver Tickets</button>
                            </div>
                        `;
                        contenedorRifas.appendChild(rifaCard);
                    });

                    const btnsVerTickets = document.querySelectorAll('.js-abrir-modal-tickets');
                    btnsVerTickets.forEach(button => {
                        button.removeEventListener('click', abrirModalTickets);
                        button.addEventListener('click', function() {
                            const rifaId = this.dataset.rifaId;
                            abrirModalTickets(rifaId);
                        });
                    });

                } catch (error) {
                    console.error('Error al cargar las rifas en el frontend (index.html):', error);
                    contenedorRifas.innerHTML = '<p class="mensaje-error">Error al cargar las rifas. Por favor, inténtalo de nuevo más tarde.</p>';
                    showMessage('Error al cargar las rifas. Por favor, inténtalo de nuevo.', 'error');
                }
            }
            fetchAllRifas();
        }
    }

    // --- CONTROL DE TICKETS (Funcionalidad de cantidad de boletos en rifa.html) ---
    const inputCantidad = document.getElementById("cantidadTickets");
    const btnSumar = document.getElementById("sumar");
    const btnRestar = document.getElementById("restar");
    const botonesRapidos = document.querySelectorAll(".botones-cantidad-rapida button");
    const precioTicketDisplaySpan = document.getElementById("precioTicketDisplay");
    const precioBsDisplaySpan = document.getElementById("precioBsDisplay");
    const totalPagarDisplay = document.getElementById("totalPagarDisplay");

    let rifaPrecioUnitario = 0;
    let rifaTasaCambio = 0;
    const MIN_TICKETS_COMPRA = 2;

    if (inputCantidad) {
        inputCantidad.value = MIN_TICKETS_COMPRA;
        inputCantidad.min = MIN_TICKETS_COMPRA;
    }

    function actualizarTotalPagar() {
        if (inputCantidad && totalPagarDisplay && precioTicketDisplaySpan && rifaPrecioUnitario > 0) {
            const cantidad = Number(inputCantidad.value);
            const totalUSD = cantidad * rifaPrecioUnitario;
            let totalDisplayValue = `$${totalUSD.toFixed(2)}`;

            if (rifaTasaCambio > 0) {
                const totalVES = totalUSD * rifaTasaCambio;
                totalDisplayValue += ` / VES ${totalVES.toFixed(2)}`;
            }
            totalPagarDisplay.textContent = totalDisplayValue;

            if (precioBsDisplaySpan && rifaTasaCambio > 0) {
                const precioEnBs = rifaPrecioUnitario * rifaTasaCambio;
                precioBsDisplaySpan.textContent = precioEnBs.toFixed(2);
            }
        } else {
            if (totalPagarDisplay) totalPagarDisplay.textContent = '$0.00 / VES 0.00';
        }
    }

    if (inputCantidad && btnSumar && btnRestar && botonesRapidos.length > 0) {
        btnSumar.addEventListener("click", () => {
            inputCantidad.value = Number(inputCantidad.value) + 1;
            actualizarTotalPagar();
        });

        btnRestar.addEventListener("click", () => {
            const actual = Number(inputCantidad.value);
            if (actual > MIN_TICKETS_COMPRA) {
                inputCantidad.value = actual - 1;
            } else {
                showMessage(`La compra mínima de boletos es ${MIN_TICKETS_COMPRA}.`, 'info');
            }
            actualizarTotalPagar();
        });

        inputCantidad.addEventListener("input", () => {
            let valor = parseInt(inputCantidad.value);
            if (isNaN(valor) || valor < MIN_TICKETS_COMPRA) {
                inputCantidad.value = MIN_TICKETS_COMPRA;
            }
            actualizarTotalPagar();
        });

        botonesRapidos.forEach(btn => {
            btn.addEventListener("click", () => {
                const val = Number(btn.dataset.val);
                if (val >= MIN_TICKETS_COMPRA) {
                    inputCantidad.value = val;
                } else {
                    inputCantidad.value = MIN_TICKETS_COMPRA;
                    showMessage(`La compra mínima de boletos es ${MIN_TICKETS_COMPRA}.`, 'info');
                }
                actualizarTotalPagar();
            });
        });
    }

    // === NAVEGACIÓN ENTRE SECCIONES (Compra y Pago en rifa.html) ===
    const seccionPago = document.getElementById("seccion-pago");
    const atrasMetodoBtn = document.getElementById("atrasMetodo");
    const btnAtrasCompra = document.getElementById("btnAtrasCompra");

    if (formUsuario && seccionCompra && seccionPago) {
        formUsuario.addEventListener("submit", (e) => {
            e.preventDefault();
            const nombreInput = document.querySelector(".formulario-usuario input[name='nombre']");
            const telefonoInput = document.querySelector(".formulario-usuario input[name='telefono']");
            const correoInput = document.querySelector(".formulario-usuario input[name='correo']");

            if (Number(inputCantidad.value) < MIN_TICKETS_COMPRA) {
                showMessage(`Debes comprar al menos ${MIN_TICKETS_COMPRA} boletos para continuar.`, 'error');
                return;
            }

            if (!nombreInput.value || !telefonoInput.value || !correoInput.value) {
                showMessage('Por favor, completa todos los campos del formulario de datos personales.', 'error');
                return;
            }

            seccionCompra.classList.add("oculto");
            seccionPago.classList.remove("oculto");
        });
    }

    if (atrasMetodoBtn && seccionPago && seccionCompra) {
        atrasMetodoBtn.addEventListener("click", () => {
            seccionPago.classList.add("oculto");
            seccionCompra.classList.remove("oculto");
            const detallesDinamicosPago = document.getElementById('detalles-dinamicos-pago');
            if (detallesDinamicosPago) detallesDinamicosPago.innerHTML = "";
            detallesPago.classList.add("oculto");
            const allPaymentButtons = document.querySelectorAll('.metodos-pago .metodo');
            allPaymentButtons.forEach(btn => {
                btn.classList.remove("seleccionado");
            });
            const formularioComprobante = document.getElementById('formulario-comprobante');
            if (formularioComprobante) formularioComprobante.classList.add('oculto');
            // Limpiar errores en línea al regresar
            const referenciaInput = document.querySelector('input[name="referenciaPago"]');
            const comprobantePagoInput = document.getElementById('comprobantePago');
            if (referenciaInput) clearInlineError(referenciaInput);
            if (comprobantePagoInput) clearInlineError(comprobantePagoInput);
        });
    }

    if (btnAtrasCompra) {
        btnAtrasCompra.addEventListener("click", () => {
            window.location.href = 'index.html';
        });
    }

    // === MÉTODO DE PAGO DINÁMICO (INTEGRACIÓN ZELLE) ===
    const btnBinance = document.getElementById("pagoBinance");
    const btnPagoMovil = document.getElementById("pagoMovil");
    const btnZelle = document.getElementById("pagoZelle");
    const detallesPago = document.getElementById("detalles-pago");
    const tasaBCVDisplay = document.getElementById("tasaBCVDisplay");
    const detallesDinamicosPago = document.getElementById('detalles-dinamicos-pago');
    const formularioComprobante = document.getElementById('formulario-comprobante');
    const comprobantePagoInput = document.getElementById('comprobantePago'); // Definición aquí
    let metodoPagoSeleccionado = '';

    if (detallesPago && inputCantidad) {
        function limpiarSeleccion() {
            const allPaymentButtons = document.querySelectorAll('.metodos-pago .metodo');
            allPaymentButtons.forEach(btn => {
                btn.classList.remove("seleccionado");
            });
            if (detallesDinamicosPago) detallesDinamicosPago.innerHTML = "";
            detallesPago.classList.add("oculto");
            metodoPagoSeleccionado = '';
            if (formularioComprobante) formularioComprobante.classList.add('oculto');
            // Limpiar errores en línea de los campos de referencia/comprobante
            const currentReferenciaInput = document.querySelector('input[name="referenciaPago"]');
            if (currentReferenciaInput) clearInlineError(currentReferenciaInput);
            if (comprobantePagoInput) clearInlineError(comprobantePagoInput);
        }

        function mostrarDetalles(metodo) {
            if (rifaPrecioUnitario === 0) {
                showMessage('No se pudo cargar la información de precios de la rifa. Intenta recargar la página.', 'error');
                return;
            }

            // Limpiar errores en línea antes de mostrar nuevos detalles
            const currentReferenciaInput = document.querySelector('input[name="referenciaPago"]');
            if (currentReferenciaInput) clearInlineError(currentReferenciaInput);
            if (comprobantePagoInput) clearInlineError(comprobantePagoInput);


            const cantidad = Number(inputCantidad.value);
            const totalUSD = cantidad * rifaPrecioUnitario;
            let html = "";

            if (metodo === "binance") {
                html = `
                    <h4>Pago vía Binance USDT</h4>
                    <p><strong>Usuario:</strong> Jesus Galindez</p>
                    <p><strong>Correo:</strong> napogalindez@gmail.com</p>
                    <p><strong>Compra mínima para este metodo de pago:</strong> 5 Tickets</p>
                    <p><strong>Monto a pagar:</strong> $<span id="montoBinanceDisplay">${totalUSD.toFixed(2)}</span></p>
                    <label for="referenciaBinance">Referencia / ID de la Transacción:</label>
                    <input type="text" id="referenciaBinance" name="referenciaPago" placeholder="ID de la transacción Binance" required />
                `;
                metodoPagoSeleccionado = 'Binance';
                if (formularioComprobante) formularioComprobante.classList.remove('oculto');
                if (cantidad < 5) {
                    showMessage('Para pagos con Binance, la compra mínima es de 5 tickets. Por favor, ajusta la cantidad o selecciona otro método.', 'error');
                }
            } else if (metodo === "pagomovil") {
                if (rifaTasaCambio === 0) {
                    showMessage('La tasa de cambio no está disponible para este método de pago.', 'error');
                    return;
                }
                const totalBs = totalUSD * rifaTasaCambio;
                const banco = 'Venezuela';
                const telefono = '0414-3548533';
                const ciCompleto = 'V-24771856'; // Guardamos el CI completo para mostrar
                const ciSoloNumeros = '24771856'; // Creamos una variable solo para los números del CI

                html = `
                    <h4>Pago Móvil</h4>
                    <p><strong>Banco:</strong> ${banco}</p>
                    <p><strong>Teléfono:</strong> ${telefono}</p>
                    <p><strong>CI:</strong> ${ciCompleto}</p>
                    <p><strong>Monto a pagar:</strong> ${totalBs.toFixed(2)} Bs</p>

                    <div id="pagomovilDataToCopy" style="display:none;"></div> 

                    <button type="button" class="btn-copiar-datos" data-target="pagomovilDataToCopy"
                            data-banco="${banco}"
                            data-telefono="${telefono}"
                            data-ci="${ciSoloNumeros}">Copiar Datos</button>

                    <label for="referenciaPagoMovil">Últimos 6 dígitos de la referencia bancaria:</label>
                    <input type="text" id="referenciaPagoMovil" name="referenciaPago" maxlength="6" pattern="\\d{6}" placeholder="Ej: 123456" required />
                `;
                metodoPagoSeleccionado = 'Pago Móvil';
                if (formularioComprobante) formularioComprobante.classList.remove('oculto');
            } else if (metodo === "zelle") {
                html = `
                    <h4>Pago vía Zelle</h4>
                    <p><strong>Correo:</strong> modorifa@gmail.com</p>
                    <p><strong>Nombre:</strong> Elvia Nunez</p>
                    <p><strong>Compra mínima para este metodo de pago:</strong> 10 Tickets</p>
                    <p><strong>Monto a pagar:</strong> $<span id="montoZelleDisplay">${totalUSD.toFixed(2)}</span></p>
                    <label for="referenciaZelle">Confirmación o Nombre de Envío:</label>
                    <input type="text" id="referenciaZelle" name="referenciaPago" placeholder="ID o Nombre de la transacción" required />
                `;
                metodoPagoSeleccionado = 'Zelle';
                if (formularioComprobante) formularioComprobante.classList.remove('oculto');
                if (cantidad < 10) {
                    showMessage('Para pagos con Zelle, la compra mínima es de 10 tickets. Por favor, ajusta la cantidad o selecciona otro método.', 'error');
                }
            }

            if (detallesDinamicosPago) {
                detallesDinamicosPago.innerHTML = html;
                detallesPago.classList.remove("oculto");

                // === AÑADIR EVENT LISTENERS A LOS BOTONES DE COPIAR DESPUÉS DE QUE EL HTML SE HAYA INSERTADO ===
                const copiarBtns = detallesDinamicosPago.querySelectorAll('.btn-copiar-datos');
                copiarBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Obtenemos los datos directamente de los atributos 'data-' del botón
                        const bancoACopiar = btn.dataset.banco;
                        const telefonoACopiar = btn.dataset.telefono;
                        const ciACopiar = btn.dataset.ci; // Este ya tiene solo los números

                        // Construimos la cadena EXACTA que queremos copiar
                        // Formato: cada dato en una nueva línea
                        const textToCopy = `${bancoACopiar}\n${telefonoACopiar}\n${ciACopiar}`;
                        
                        // Si quisieras separados por comas:
                        // const textToCopy = `${bancoACopiar},${telefonoACopiar},${ciACopiar}`;
                        
                        // O solo espacio:
                        // const textToCopy = `${bancoACopiar} ${telefonoACopiar} ${ciACopiar}`;

                        navigator.clipboard.writeText(textToCopy)
                            .then(() => {
                                showMessage('Datos copiados al portapapeles.', 'success');
                                btn.textContent = '¡Copiado!'; // Feedback visual
                                setTimeout(() => {
                                    btn.textContent = 'Copiar Datos'; // Restaurar texto
                                }, 2000);
                            })
                            .catch(err => {
                                console.error('Error al copiar: ', err);
                                showMessage('Error al copiar los datos.', 'error');
                            });
                    });
                });
                // ===========================================================================================
            }
        }

        if (btnBinance) {
            btnBinance.addEventListener("click", () => {
                limpiarSeleccion();
                btnBinance.classList.add("seleccionado");
                mostrarDetalles("binance");
            });
        }

        if (btnPagoMovil) {
            btnPagoMovil.addEventListener("click", () => {
                limpiarSeleccion();
                btnPagoMovil.classList.add("seleccionado");
                mostrarDetalles("pagomovil");
            });
        }

        if (btnZelle) {
            btnZelle.addEventListener("click", () => {
                limpiarSeleccion();
                btnZelle.classList.add("seleccionado");
                mostrarDetalles("zelle");
            });
        }
    }

    // === Carga de detalles de la rifa en rifa.html (cuando se accede con un ID) ===
    const rifaId = getUrlParameter('id');
    const seccionRifaDetalle = document.getElementById('seccion-rifa-detalle');

    if (rifaId && seccionRifaDetalle) {
        async function fetchRifaDetails(id) {
            try {
                const response = await fetch(`${API_URL}/rifas/${id}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const rifa = await response.json();

                const rifaTituloElement = document.getElementById('rifaTitulo');
                if (rifaTituloElement) rifaTituloElement.textContent = rifa.nombreProducto;
                const rifaImagenElement = document.getElementById('rifaImagen');
                if (rifaImagenElement) rifaImagenElement.src = rifa.imagenUrl;
                const rifaDescripcionElement = document.getElementById('rifaDescripcion');
                if (rifaDescripcionElement) rifaDescripcionElement.textContent = rifa.descripcion;
                const rifaPrecioElement = document.getElementById('rifaPrecio');
                if (rifaPrecioElement) rifaPrecioElement.textContent = rifa.precioTicketUSD.toFixed(2);

                const porcentaje = rifa.totalTickets > 0 ? (rifa.ticketsVendidos / rifa.totalTickets) * 100 : 0;
                const barraProgresoDetalle = document.querySelector('.barra-global-progreso');
                const porcentajeVentaTexto = document.getElementById('barraProgresoDetalle');

                if (barraProgresoDetalle) barraProgresoDetalle.style.width = `${porcentaje}%`;
                if (porcentajeVentaTexto) porcentajeVentaTexto.textContent = `${porcentaje.toFixed(0)}% Vendido`;

                const rifaInicioFechaElement = document.getElementById('rifaInicioFecha');
                if (rifaInicioFechaElement) {
                    if (rifa.fechaInicioSorteo) {
                        rifaInicioFechaElement.textContent = new Date(rifa.fechaInicioSorteo).toLocaleDateString('es-VE');
                    } else {
                        rifaInicioFechaElement.textContent = 'N/A';
                    }
                }

                const rifaFinFechaElement = document.getElementById('rifaFinFecha');
                if (rifaFinFechaElement) {
                    if (rifa.fechaFin) {
                        rifaFinFechaElement.textContent = new Date(rifa.fechaFin).toLocaleString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                    } else {
                        rifaFinFechaElement.textContent = 'N/A';
                    }
                }

                rifaPrecioUnitario = rifa.precioTicketUSD;
                if (precioTicketDisplaySpan) precioTicketDisplaySpan.textContent = rifaPrecioUnitario.toFixed(2);

                if (rifa.tasaCambio && typeof rifa.tasaCambio === 'number' && rifa.tasaCambio > 0) {
                    rifaTasaCambio = rifa.tasaCambio;
                    if (tasaBCVDisplay) tasaBCVDisplay.textContent = `${rifaTasaCambio.toFixed(2)} Bs/USD`;
                } else {
                    rifaTasaCambio = 0;
                    if (tasaBCVDisplay) tasaBCVDisplay.textContent = 'N/A Bs/USD';
                }

                actualizarTotalPagar();

            } catch (error) {
                console.error('Error al cargar los detalles de la rifa en rifa.html:', error);
                showMessage('Error al cargar los detalles de la rifa. Por favor, inténtalo de nuevo.', 'error');
            }
        }
        fetchRifaDetails(rifaId);
    }

    const siguienteMetodoBtn = document.getElementById("siguienteMetodo");
    const seccionFinal = document.getElementById("seccion-final");
    const nombreConfirmacion = document.getElementById("nombreConfirmacion");
    const datoNombre = document.getElementById("datoNombre");
    const datoCorreo = document.getElementById("datoCorreo");
    const datoTelefono = document.getElementById("datoTelefono");
    const datoMetodo = document.getElementById("datoMetodo");
    const datoCantidad = document.getElementById("datoCantidad");
    const boletosAsignadosContenedor = document.getElementById("boletosAsignados");

    // --- NUEVAS FUNCIONES PARA ERRORES EN LÍNEA ---
    function displayInlineError(inputElement, message) {
        if (!inputElement) return; // Asegúrate de que el elemento exista
        let errorSpan = inputElement.nextElementSibling;
        if (!errorSpan || !errorSpan.classList.contains('error-message')) {
            errorSpan = document.createElement('span');
            errorSpan.classList.add('error-message');
            inputElement.parentNode.insertBefore(errorSpan, inputElement.nextSibling);
        }
        errorSpan.textContent = message;
        inputElement.classList.add('input-error');
    }

    function clearInlineError(inputElement) {
        if (!inputElement) return; // Asegúrate de que el elemento exista
        let errorSpan = inputElement.nextElementSibling;
        if (errorSpan && errorSpan.classList.contains('error-message')) {
            errorSpan.textContent = '';
            inputElement.classList.remove('input-error');
            // Si el error span no tiene texto y no hay otros errores en línea cerca, puedes removerlo.
            // O simplemente dejarlo vacío si es un span preexistente en el HTML
        }
    }
    // --- FIN NUEVAS FUNCIONES PARA ERRORES EN LÍNEA ---

    if (siguienteMetodoBtn) {
        siguienteMetodoBtn.addEventListener("click", async () => {

            if (!metodoPagoSeleccionado) {
                showMessage('Por favor, selecciona un método de pago.', 'error');
                return;
            }

            const referenciaPagoInput = document.querySelector('input[name="referenciaPago"]');
            // Asegúrate de que comprobantePagoInput esté definido globalmente o dentro de este scope
            // Ya está definido en la sección de métodos de pago.

            // Limpiar errores en línea previos antes de revalidar
            clearInlineError(referenciaPagoInput);
            clearInlineError(comprobantePagoInput);


            const formularioComprobanteVisible = formularioComprobante && !formularioComprobante.classList.contains('oculto');

            // === VALIDACIONES DEL COMPROBANTE Y REFERENCIA (ROBUSTA) ===
            if (formularioComprobanteVisible) {
                const referenciaValida = referenciaPagoInput && referenciaPagoInput.value.trim() !== '';
                const comprobanteAdjunto = comprobantePagoInput && comprobantePagoInput.files && comprobantePagoInput.files.length > 0;

                // Si no hay referencia Y no hay comprobante
                if (!referenciaValida && !comprobanteAdjunto) {
                    displayInlineError(referenciaPagoInput, 'Campo requerido.');
                    displayInlineError(comprobantePagoInput, 'Requerido.');
                    showMessage('Debes ingresar la referencia de pago y subir el comprobante para continuar.', 'error');
                    return;
                }

                // Si solo falta la referencia
                if (!referenciaValida) {
                    displayInlineError(referenciaPagoInput, 'Por favor, ingresa la referencia de pago.');
                    return;
                }

                // Si solo falta el comprobante
                if (!comprobanteAdjunto) {
                    displayInlineError(comprobantePagoInput, 'Por favor, sube el comprobante de pago.');
                    return;
                }
            }
            // ===============================================

            const nombreInput = document.querySelector(".formulario-usuario input[name='nombre']");
            const telefonoInput = document.querySelector(".formulario-usuario input[name='telefono']");
            const correoInput = document.querySelector(".formulario-usuario input[name='correo']");
            const tipoIdentificacionInput = document.querySelector(".formulario-usuario select[name='tipoIdentificacion']");
            const numeroIdentificacionInput = document.querySelector(".formulario-usuario input[name='numeroIdentificacion']");

            const nombreComprador = nombreInput ? nombreInput.value : '';
            const telefonoComprador = telefonoInput ? telefonoInput.value : '';
            const emailComprador = correoInput ? correoInput.value : '';
            const tipoIdentificacionComprador = tipoIdentificacionInput ? tipoIdentificacionInput.value : '';
            const numeroIdentificacionComprador = numeroIdentificacionInput ? numeroIdentificacionInput.value : '';

            const cantidadTickets = Number(inputCantidad.value);
            const montoTotal = cantidadTickets * rifaPrecioUnitario;
            const monedaPago = (metodoPagoSeleccionado === 'Pago Móvil') ? 'VES' : 'USD';
            let montoFinalAPagar = montoTotal;
            if (monedaPago === 'VES') {
                montoFinalAPagar = montoTotal * rifaTasaCambio;
            }

            const formData = new FormData();
            formData.append('rifaId', rifaId);
            formData.append('cantidadTickets', cantidadTickets);
            formData.append('montoTotal', montoFinalAPagar);
            formData.append('moneda', monedaPago);
            formData.append('metodo', metodoPagoSeleccionado);
            formData.append('referenciaPago', referenciaPagoInput ? referenciaPagoInput.value : '');

            if (comprobantePagoInput && comprobantePagoInput.files && comprobantePagoInput.files.length > 0) {
                formData.append('comprobante', comprobantePagoInput.files[0]);
            }

            formData.append('nombreComprador', nombreComprador);
            formData.append('emailComprador', emailComprador);
            formData.append('telefonoComprador', telefonoComprador);
            formData.append('tipoIdentificacionComprador', tipoIdentificacionComprador);
            formData.append('numeroIdentificacionComprador', numeroIdentificacionComprador);
            formData.append('tasaCambioUsada', rifaTasaCambio);

            // --- Lógica del Loader y el Botón (solo si todas las validaciones pasan) ---
            siguienteMetodoBtn.disabled = true;
            siguienteMetodoBtn.classList.add('is-loading');
            showMessage('Registrando tu pago, por favor espera...', 'info');

            try {
                const response = await fetch(`${API_URL}/pagos`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Error al registrar el pago.');

                showMessage('¡Pago registrado exitosamente! Recibirás tus boletos pronto.', 'success');
                seccionPago.classList.add("oculto");
                seccionFinal.classList.remove("oculto");

                nombreConfirmacion.textContent = data.nombreComprador;
                datoNombre.textContent = data.nombreComprador;
                datoCorreo.textContent = data.emailComprador;
                datoTelefono.textContent = data.telefonoComprador;
                datoMetodo.textContent = data.metodo;
                datoCantidad.textContent = data.cantidadTickets;

                boletosAsignadosContenedor.innerHTML = '';
                if (data.numerosTicketsAsignados && data.numerosTicketsAsignados.length > 0) {
                    data.numerosTicketsAsignados.forEach(boleto => {
                        const tarjeta = document.createElement("div");
                        tarjeta.className = "boleto";
                        tarjeta.textContent = `🎟️ ${boleto.toString().padStart(4, '0')}`; // Los números para cada rifa deben ser de 10000 y deben ir desde el 0001 hasta el 10000. [cite: 2025-06-21]
                        boletosAsignadosContenedor.appendChild(tarjeta);
                    });
                } else {
                    boletosAsignadosContenedor.innerHTML = '<p class="mensaje-error">No se asignaron boletos. Contacta a soporte.</p>';
                }

            } catch (error) {
                showMessage(`Error al registrar el pago: ${error.message}`, 'error');
                seccionPago.classList.remove("oculto");
                seccionFinal.classList.add("oculto");
            } finally {
                // Restaura el botón a su estado original
                siguienteMetodoBtn.classList.remove('is-loading');
                siguienteMetodoBtn.disabled = false;
            }
        });
    }

    const modalTickets = document.getElementById('modalTickets');
    const cerrarModalBtn = document.querySelector('.cerrar-modal');
    const formConsultarTickets = document.getElementById('formConsultarTickets');
    const correoConsultaInput = document.getElementById('correoConsulta');
    const resultadosConsultaDiv = document.getElementById('resultados-consulta-tickets');

    if (modalTickets) modalTickets.dataset.currentRifaId = '';

    function abrirModalTickets(rifaId = '') {
        if (modalTickets) {
            modalTickets.classList.remove('oculto');
            modalTickets.dataset.currentRifaId = rifaId;
            if (correoConsultaInput) correoConsultaInput.value = '';
            if (resultadosConsultaDiv) resultadosConsultaDiv.innerHTML = '';
        }
    }

    function cerrarModalTickets() {
        if (modalTickets) {
            modalTickets.classList.add('oculto');
            if (correoConsultaInput) correoConsultaInput.value = '';
            if (resultadosConsultaDiv) resultadosConsultaDiv.innerHTML = '';
            modalTickets.dataset.currentRifaId = '';
        }
    }

    if (cerrarModalBtn) cerrarModalBtn.addEventListener('click', cerrarModalTickets);
    if (modalTickets) window.addEventListener('click', (event) => { if (event.target === modalTickets) cerrarModalTickets(); });

    if (formConsultarTickets) {
        formConsultarTickets.addEventListener('submit', async (event) => {
            event.preventDefault();
            const correo = correoConsultaInput ? correoConsultaInput.value : '';
            const rifaIdConsulta = modalTickets ? modalTickets.dataset.currentRifaId : '';
            if (resultadosConsultaDiv) {
                if (!correo || !correo.includes('@')) {
                    resultadosConsultaDiv.innerHTML = `<p class="mensaje-error">Por favor, ingresa un correo electrónico válido.</p>`;
                    return;
                }
                resultadosConsultaDiv.innerHTML = `<p>Buscando tickets para: <strong>${correo}</strong>...</p>`;
            }

            try {
                let url = `${API_URL}/tickets/consultar?email=${encodeURIComponent(correo)}`;
                if (rifaIdConsulta) url += `&rifaId=${encodeURIComponent(rifaIdConsulta)}`;
                const response = await fetch(url);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Error al consultar tickets.');

                if (resultadosConsultaDiv) {
                    if (data.tickets && data.tickets.length > 0) {
                        const firstTicket = data.tickets[0];
                        let htmlResultados = `
                            <div class="consulta-header">
                                <h2>¡Gracias por tu compra, ${firstTicket.nombreComprador || 'Comprador'}!</h2>
                                <div class="buyer-details">
                                    <p><strong>Nombre:</strong> ${firstTicket.nombreComprador || 'N/A'}</p>
                                    <p><strong>Correo:</strong> ${firstTicket.emailComprador || 'N/A'}</p>
                                    <p><strong>Teléfono:</strong> ${firstTicket.telefonoComprador || 'N/A'}</p>
                                    <p><strong>Identificación:</strong> ${(firstTicket.tipoIdentificacionComprador && firstTicket.numeroIdentificacionComprador) ? `${firstTicket.tipoIdentificacionComprador}-${firstTicket.numeroIdentificacionComprador}` : 'N/A'}</p>
                                </div>
                                <h4>Tus tickets:</h4>
                            </div>
                        `;

                        const ticketsAgrupadosPorRifa = data.tickets.reduce((acc, ticket) => {
                            const rifaDetail = ticket.rifaId;
                            const currentRifaId = rifaDetail ? rifaDetail._id : 'unknown_rifa';
                            const rifaName = (rifaDetail && rifaDetail.nombreProducto) ? rifaDetail.nombreProducto : 'Rifa Desconocida';
                            if (!acc[currentRifaId]) {
                                acc[currentRifaId] = { nombreProducto: rifaName, boletos: [] };
                            }
                            acc[currentRifaId].boletos.push(ticket.numeroTicket);
                            return acc;
                        }, {});

                        for (const rifaId in ticketsAgrupadosPorRifa) {
                            const rifaData = ticketsAgrupadosPorRifa[rifaId];
                            htmlResultados += `
                                <div class="rifa-tickets-group">
                                    <p><strong>Rifa:</strong> ${rifaData.nombreProducto}</p>
                                    <div class="boletos-list">
                            `;
                            rifaData.boletos.sort((a, b) => a - b).forEach(boletoNum => {
                                htmlResultados += `<span class="boleto">🎟️ ${boletoNum.toString().padStart(4, '0')}</span>`; // Los números para cada rifa deben ser de 10000 y deben ir desde el 0001 hasta el 10000. [cite: 2025-06-21]
                            });
                            htmlResultados += `
                                    </div>
                                </div>
                            `;
                        }
                        resultadosConsultaDiv.innerHTML = htmlResultados;
                    } else {
                        resultadosConsultaDiv.innerHTML = `<p class="mensaje-info">No se encontraron tickets asociados a este correo electrónico ${rifaIdConsulta ? `para esta rifa.` : `.`}</p>`;
                    }
                }
            } catch (error) {
                if (resultadosConsultaDiv) resultadosConsultaDiv.innerHTML = `<p class="mensaje-error">Error al consultar tickets: ${error.message}</p>`;
            }
        });
    }
});