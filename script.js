let listaJugadores = [];
let intervalo;
let relojCorriendo = false;

// Configuración de tiempos
let cuartoActual = 1;
let modoDescanso = false;
let tiempoCuarto = 17 * 60; // 17 minutos por cuarto
let segundosRestantes = tiempoCuarto; // Empezamos con el 1er cuarto

function agregarJugador() {
    const id = document.getElementById('p-id').value;
    const nombre = document.getElementById('p-name').value;
    const pos = document.getElementById('p-pos').value;
    const empiezaEnCancha = document.getElementById('p-enCancha').value === 'T';
    const minCambio = document.getElementById('p-cambio').value;
    const jugadorACambiar = document.getElementById('p-jugadorCambio').value;

    if(id && nombre) {
        listaJugadores.push({ 
            id, nombre, pos, 
            enCancha: empiezaEnCancha, 
            estadoInicial: empiezaEnCancha, 
            minCambio: minCambio ? parseInt(minCambio) : null, 
            jugadorACambiar 
        });
        actualizarTabla();
        // Limpiar campos
        document.getElementById('p-id').value = '';
        document.getElementById('p-name').value = '';
        document.getElementById('p-cambio').value = '';
        document.getElementById('p-jugadorCambio').value = '';
    }
}

function actualizarTabla() {
    const cuerpo = document.getElementById('lista-previa');
    cuerpo.innerHTML = listaJugadores.map((p, index) => `
        <tr>
            <td>${p.id}</td><td>${p.nombre}</td><td>${p.pos}</td>
            <td>${p.enCancha ? 'Titular' : 'Suplente'}</td>
            <td>${p.minCambio ? p.minCambio + "'" : '-'}</td>
            <td><button onclick="eliminar(${index})" style="background:#c0392b; color:white; border:none; cursor:pointer;">X</button></td>
        </tr>
    `).join('');
}

function eliminar(i) {
    listaJugadores.splice(i, 1);
    actualizarTabla();
}

function iniciarPartido() {
    if(listaJugadores.length === 0) return alert("Cargá jugadores primero");
    document.getElementById('setup-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    renderJuego();
    // Iniciar el reloj inmediatamente
    relojCorriendo = true;
    intervalo = setInterval(bajarTiempo, 1000);
    const btn = document.getElementById('btn-timer');
    btn.innerText = "PAUSAR";
    btn.style.background = "#e67e22";
}

function controlarReloj() {
    const btn = document.getElementById('btn-timer');
    if(!relojCorriendo) {
        intervalo = setInterval(bajarTiempo, 1000);
        btn.innerText = "PAUSAR";
        btn.style.background = "#e67e22";
    } else {
        clearInterval(intervalo);
        btn.innerText = "REANUDAR";
        btn.style.background = "#27ae60";
    }
    relojCorriendo = !relojCorriendo;
}

function bajarTiempo() {
    if(segundosRestantes <= 0) {
        manejarCambioDePeriodoAutomatico();
        return;
    }
    segundosRestantes--;
    actualizarDisplay();

    if (!modoDescanso) {
        const m = Math.floor(segundosRestantes / 60);
        const s = segundosRestantes % 60;

        // Buscamos todos los jugadores que deben entrar en este segundo
        const cambiosDeEsteMinuto = listaJugadores.filter(p => !p.enCancha && p.minCambio === m && s === 0);

        if (cambiosDeEsteMinuto.length > 0) {
            procesarMultiplesCambios(cambiosDeEsteMinuto);
        }
    }
}

// NUEVA FUNCIÓN: Maneja el paso de Cuarto a Descanso y viceversa automáticamente
function manejarCambioDePeriodoAutomatico() {
    const display = document.getElementById('timer-display');

    if (!modoDescanso) {
        // Si terminó el cuarto 4, se acaba el partido
        if (cuartoActual === 4) {
            clearInterval(intervalo);
            relojCorriendo = false;
            alert("¡PARTIDO FINALIZADO!");
            return;
        }

        // Iniciar Descanso Automático
        modoDescanso = true;
        let minDescanso = (cuartoActual === 2) ? 5 : 2;
        segundosRestantes = minDescanso * 60;
        display.style.color = "#3498db"; 
        console.log("Iniciando Descanso automático...");
    } else {
        // Iniciar Siguiente Cuarto Automático
        modoDescanso = false;
        cuartoActual++;
        segundosRestantes = 17 * 60;
        
        // Restaurar posiciones iniciales
        listaJugadores.forEach(p => p.enCancha = p.estadoInicial);
        
        display.style.color = "#2ecc71"; 
        renderJuego();
        console.log("Iniciando Cuarto automático...");
    }
    actualizarDisplay();
}

function actualizarDisplay() {
    const m = Math.floor(segundosRestantes / 60);
    const s = segundosRestantes % 60;
    const textoCuarto = modoDescanso ? `DESCANSO` : `CUARTO ${cuartoActual}`;
    document.getElementById('timer-display').innerHTML = 
        `<small style="font-size:1.5rem; display:block;">${textoCuarto}</small>` +
        `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function procesarMultiplesCambios(jugadoresQueEntran) {
    let mensajes = [];

    jugadoresQueEntran.forEach(pEntra => {
        const pSale = listaJugadores.find(j => j.id === pEntra.jugadorACambiar);
        
        if (pSale && pSale.enCancha) {
            pEntra.enCancha = true;
            pSale.enCancha = false;
            mensajes.push(`Entra #${pEntra.id} por #${pSale.id}`);
        }
    });

    if (mensajes.length > 0) {
        // Unimos todos los mensajes con un salto de línea o un separador
        const alertaFinal = "🔄 <strong>CAMBIOS:</strong><br>" + mensajes.join('<br>');
        mostrarAlerta(alertaFinal);
        renderJuego();
        
        // Sonido de alerta único para el grupo de cambios
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play();
    }
}

function mostrarAlerta(msj) {
    const div = document.getElementById('alerta-cambio');
    div.innerHTML = msj; // Cambiado a innerHTML para soportar el listado
    div.style.display = 'block';
    
    // Aumentamos un poco el tiempo a 8 segundos para que dé tiempo a leer varios nombres
    setTimeout(() => { div.style.display = 'none'; }, 8000);
}


function renderJuego() {
    const cancha = document.getElementById('jugadores-cancha');
    const banco = document.getElementById('jugadores-banco');
    cancha.innerHTML = ''; banco.innerHTML = '';

    listaJugadores.forEach(p => {
        // Si es suplente y tiene minuto de cambio, mostramos el aviso al lado del nombre
        const infoCambio = (!p.enCancha && p.minCambio) ? ` <span style="color:#f39c12; font-size:0.8em;">
        (Entra al min ${p.minCambio} por #${p.jugadorACambiar})</span>` : "";
        
        const html = `<div class="player-tag">#${p.id} - ${p.nombre} (${p.pos})${infoCambio}</div>`;
        
        p.enCancha ? cancha.innerHTML += html : banco.innerHTML += html;
    });
}