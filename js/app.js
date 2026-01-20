// Configuración de la API
const API_URL = 'http://localhost:5017/api/sorteos';

// Obtener número de recibo del URL
const urlParams = new URLSearchParams(window.location.search);
const numeroRecibo = urlParams.get('r');

// Validar recibo al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    if (!numeroRecibo) {
        mostrarError('URL inválida. Escanea el QR nuevamente.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/validar-recibo?numeroRecibo=${numeroRecibo}`);
        const data = await response.json();

        if (!data.existe) {
            mostrarError('Recibo no encontrado en el sistema.');
            return;
        }

        if (data.yaRegistrado) {
            mostrarError('Este recibo ya fue registrado anteriormente.');
            return;
        }

        if (data.cuponesCalculados < 1) {
            mostrarError(data.mensaje);
            return;
        }

        // Mostrar formulario
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('formulario').classList.remove('hidden');
        document.getElementById('numeroRecibo').textContent = numeroRecibo;
        document.getElementById('valorCompra').textContent = formatMoney(data.valorCompra);
        document.getElementById('cuponesCalculados').textContent = data.cuponesCalculados;

    } catch (error) {
        mostrarError('Error al conectar con el servidor. Intenta más tarde.');
        console.error('Error:', error);
    }
});

// Enviar formulario de registro
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnRegistrar = document.getElementById('btnRegistrar');
    btnRegistrar.disabled = true;
    btnRegistrar.textContent = 'Registrando...';

    const datos = {
        numeroRecibo: numeroRecibo,
        tipoDocumento: document.getElementById('tipoDocumento').value,
        numeroDocumento: document.getElementById('numeroDocumento').value,
        nombres: document.getElementById('nombres').value,
        apellidos: document.getElementById('apellidos').value,
        email: document.getElementById('email').value,
        aceptaHabeasData: document.getElementById('habeasData').checked
    };

    try {
        const response = await fetch(`${API_URL}/registrar-cliente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const result = await response.json();

        if (result.exito) {
            mostrarExito(result);
        } else {
            mostrarMensajeError(result.mensaje);
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = 'ENVIAR REGISTRO';
        }

    } catch (error) {
        mostrarMensajeError('Error al procesar el registro. Intenta nuevamente.');
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = 'ENVIAR REGISTRO';
        console.error('Error:', error);
    }
});

// Funciones auxiliares
function mostrarError(mensaje) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('errorGeneral').classList.remove('hidden');
    document.getElementById('mensajeErrorGeneral').textContent = mensaje;
}

function mostrarMensajeError(mensaje) {
    const div = document.getElementById('mensajeError');
    div.textContent = mensaje;
    div.classList.remove('hidden');
}

function mostrarExito(result) {
    document.getElementById('formulario').classList.add('hidden');
    document.getElementById('exito').classList.remove('hidden');
    document.getElementById('mensajeExito').textContent = 
        `Has generado ${result.cuponesGenerados} cupón(es). Total acumulado: ${result.totalCuponesAcumulados}`;
    
    const listaCupones = document.getElementById('listaCupones');
    result.codigosCupones.forEach(codigo => {
        const div = document.createElement('div');
        div.className = 'cupon-code';
        div.textContent = codigo;
        listaCupones.appendChild(div);
    });
}

function formatMoney(value) {
    return new Intl.NumberFormat('es-CO').format(value);
}