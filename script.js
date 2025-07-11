import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://psujtchqgwthuobvvthv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdWp0Y2hxZ3d0aHVvYnZ2dGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjEwNjIsImV4cCI6MjA2NzE5NzA2Mn0._3U4T28cGy38Y81kB3lGyE4rU9P6fZpzM1QxzyVFhPc';
const supabase = createClient(supabaseUrl, supabaseKey);

const lista = document.getElementById('lista-frases');
const recargarBtn = document.getElementById('recargar');
const filtroNivel = document.getElementById('filtro-nivel');
const buscadorFrase = document.getElementById('buscador-frase');

// Elementos para la funcionalidad de guardar nueva frase
const nuevaFraseInput = document.getElementById('nueva-frase-input');
const nivelNuevaFraseSelect = document.getElementById('nivel-nueva-frase');
const guardarFraseBtn = document.getElementById('guardar-frase-btn');
const mensajeGuardar = document.getElementById('mensaje-guardar');

// Elementos del modal de edición
const editModal = document.getElementById('edit-modal');
const closeButton = document.querySelector('.close-button'); // Esto puede seleccionar el primero, si hay múltiples
const editFraseId = document.getElementById('edit-frase-id');
const editFraseInput = document.getElementById('edit-frase-input');
const editNivelSelect = document.getElementById('edit-nivel-select');
const guardarCambiosBtn = document.getElementById('guardar-cambios-btn'); // ID es único
const mensajeEdicion = document.getElementById('mensaje-edicion');

// Elementos del nuevo modal de confirmación de eliminación
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const deleteCloseButton = document.querySelector('.delete-close-button'); // Usar una clase específica para evitar conflictos
const fraseAEliminarSpan = document.getElementById('frase-a-eliminar');
const deleteFraseIdInput = document.getElementById('delete-frase-id');
const cancelarEliminarBtn = document.getElementById('cancelar-eliminar-btn');
const confirmarEliminarBtn = document.getElementById('confirmar-eliminar-btn');
const mensajeEliminacion = document.getElementById('mensaje-eliminacion');


let numeroFrase = 0; // Variable para controlar el número de la frase

function resaltarCoincidencias(texto, busqueda) {
  if (!busqueda) return texto;
  const regex = new RegExp(`(${busqueda})`, 'gi');
  return texto.replace(regex, '<strong>$1</strong>');
}

async function cargarFrases() {
  lista.innerHTML = '<li>Ładowanie...</li>';

  const nivelSeleccionado = filtroNivel.value;
  const textoBuscado = buscadorFrase.value.trim().toLowerCase();

  let query = supabase
    .from('frases_polaco')
    .select('id, frase, nivel')
    .limit(300);

  if (nivelSeleccionado) {
    query = query.eq('nivel', nivelSeleccionado);
  }

  const { data, error } = await query;

  if (error) {
    lista.innerHTML = `<li class="mensaje-error">Błąd: ${error.message}</li>`;
    return;
  }

  let frasesFiltradas = data;

  if (textoBuscado) {
    frasesFiltradas = frasesFiltradas.filter(({ frase }) =>
      frase.toLowerCase().includes(textoBuscado)
    );
  }

  if (frasesFiltradas.length === 0) {
    lista.innerHTML = '<li class="mensaje-error">Brak pasujących fraz.</li>';
    return;
  }

  const frasesAleatorias = frasesFiltradas.sort(() => Math.random() - 0.5).slice(0, 300);

  lista.innerHTML = '';
  numeroFrase = 0; // Reinicia el contador de números de frase
  frasesAleatorias.forEach(({ id, frase, nivel }) => {
    numeroFrase++; // Incrementa para cada frase
    const li = document.createElement('li');
    const resaltada = resaltarCoincidencias(frase, textoBuscado);
    li.innerHTML = `
      <span class="list-item-content">
        <span class="numero-frase">${numeroFrase}.</span>
        ${resaltada} <span class="nivel-badge">${nivel}</span>
      </span>
      <span class="actions">
          <button class="btn editar-btn" data-id="${id}" data-frase="${frase}" data-nivel="${nivel}"><i class="fas fa-edit"></i></button>
          <button class="btn eliminar-btn" data-id="${id}"><i class="fas fa-trash-alt"></i></button>
      </span>
    `;
    lista.appendChild(li);
  });

  // Agrega event listeners a los botones de editar después de que se cargan
  document.querySelectorAll('.editar-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      // Usar event.currentTarget para asegurarse de obtener el botón, no el icono
      const id = event.currentTarget.dataset.id;
      const frase = event.currentTarget.dataset.frase;
      const nivel = event.currentTarget.dataset.nivel;
      abrirModalEdicion(id, frase, nivel);
    });
  });

  // Agrega event listeners a los botones de eliminar
  document.querySelectorAll('.eliminar-btn').forEach(button => {
      button.addEventListener('click', (event) => {
          // Usar event.currentTarget para asegurarse de obtener el botón, no el icono
          const id = event.currentTarget.dataset.id;
          eliminarFrase(id); // Llama a la nueva función
      });
  });
}

async function guardarNuevaFrase() {
  const frase = nuevaFraseInput.value.trim();
  const nivel = nivelNuevaFraseSelect.value;

  if (!frase) {
    mostrarMensaje(mensajeGuardar, 'Proszę wpisać frazę do zapisania.', 'error');
    return;
  }

  guardarFraseBtn.disabled = true;
  mensajeGuardar.textContent = 'Zapisywanie...';
  mensajeGuardar.className = 'mensaje';

  const { data, error } = await supabase
    .from('frases_polaco')
    .insert([{ frase: frase, nivel: nivel }]);

  if (error) {
    console.error('Error al guardar la frase:', error);
    mostrarMensaje(mensajeGuardar, `Błąd podczas zapisywania: ${error.message}`, 'error');
  } else {
    mostrarMensaje(mensajeGuardar, 'Fraza zapisana pomyślnie!', 'success');
    nuevaFraseInput.value = '';
    cargarFrases();
  }

  guardarFraseBtn.disabled = false;
}

// Funcionalidad del modal de edición
function abrirModalEdicion(id, frase, nivel) {
  editFraseId.value = id;
  editFraseInput.value = frase;
  editNivelSelect.value = nivel;
  mensajeEdicion.textContent = ''; // Limpiar mensaje anterior
  mensajeEdicion.className = 'mensaje'; // Limpiar clases anteriores
  editModal.style.display = 'block'; // Mostrar el modal
  document.body.classList.add('modal-open'); // Deshabilita interacciones fuera del modal
}

function cerrarModalEdicion() {
  editModal.style.display = 'none'; // Ocultar el modal
  document.body.classList.remove('modal-open'); // Habilita interacciones fuera del modal
}

async function guardarCambiosEdicion() {
  const id = editFraseId.value;
  const nuevaFrase = editFraseInput.value.trim();
  const nuevoNivel = editNivelSelect.value;

  if (!nuevaFrase) {
    mostrarMensaje(mensajeEdicion, 'Proszę wpisać frazę do zapisania.', 'error');
    return;
  }

  guardarCambiosBtn.disabled = true;
  mensajeEdicion.textContent = 'Zapisywanie zmian...';
  mensajeEdicion.className = 'mensaje';

  const { data, error } = await supabase
    .from('frases_polaco')
    .update({ frase: nuevaFrase, nivel: nuevoNivel })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar la frase:', error);
    mostrarMensaje(mensajeEdicion, `Błąd podczas aktualizacji: ${error.message}`, 'error');
  } else {
    mostrarMensaje(mensajeEdicion, 'Zmiany zapisane pomyślnie!', 'success');
    cargarFrases(); // Recargar la lista para mostrar los cambios
    setTimeout(cerrarModalEdicion, 1500); // Cerrar modal después de un breve éxito
  }

  guardarCambiosBtn.disabled = false;
}

// Lógica para el nuevo modal de confirmación de eliminación
async function eliminarFrase(id) {
    // Obtenemos la frase para mostrarla en el modal de confirmación
    const { data, error } = await supabase
        .from('frases_polaco')
        .select('frase')
        .eq('id', id)
        .single(); // Usamos single() porque esperamos una sola fila

    if (error || !data) {
        console.error('Błąd podczas pobierania frazy do usunięcia:', error ? error.message : 'Fraza nie znaleziona.');
        alert('Wystąpił błąd podczas próby usunięcia frazy.'); // Mensaje de error general si no se encuentra la frase
        return;
    }

    const fraseTexto = data.frase;

    // Establecer los valores en el modal y mostrarlo
    fraseAEliminarSpan.textContent = fraseTexto;
    deleteFraseIdInput.value = id; // Guardar el ID en el campo oculto
    mensajeEliminacion.textContent = ''; // Limpiar mensajes anteriores
    mensajeEliminacion.className = 'mensaje'; // Limpiar clases anteriores
    deleteConfirmModal.style.display = 'block'; // Mostrar el modal
    document.body.classList.add('modal-open'); // Deshabilita interacciones fuera del modal
}

// Función que realmente ejecuta la eliminación después de la confirmación
async function ejecutarEliminacionConfirmada() {
    const id = deleteFraseIdInput.value; // Obtener el ID del campo oculto

    confirmarEliminarBtn.disabled = true;
    cancelarEliminarBtn.disabled = true;
    mensajeEliminacion.textContent = 'Usuwanie...';
    mensajeEliminacion.className = 'mensaje';

    const { error } = await supabase
        .from('frases_polaco')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Błąd podczas usuwania frazy:', error);
        mostrarMensaje(mensajeEliminacion, `Błąd podczas usuwania: ${error.message}`, 'error');
    } else {
        mostrarMensaje(mensajeEliminacion, 'Fraza usunięta pomyślnie!', 'success');
        cargarFrases(); // Recargar la lista para mostrar la frase eliminada
        setTimeout(cerrarDeleteConfirmModal, 1500); // Cerrar modal después de un breve éxito
    }

    confirmarEliminarBtn.disabled = false;
    cancelarEliminarBtn.disabled = false;
}

function cerrarDeleteConfirmModal() {
    deleteConfirmModal.style.display = 'none';
    document.body.classList.remove('modal-open'); // Habilita interacciones fuera del modal
}


// Función generalizada para mostrar mensajes
function mostrarMensaje(elementoMensaje, texto, tipo) {
  elementoMensaje.textContent = texto;
  elementoMensaje.className = `mensaje ${tipo}`;
  setTimeout(() => {
    elementoMensaje.textContent = '';
    elementoMensaje.className = 'mensaje';
  }, 3000);
}

// Eventos principales
window.addEventListener('load', cargarFrases);
recargarBtn.addEventListener('click', cargarFrases);
filtroNivel.addEventListener('change', cargarFrases);
buscadorFrase.addEventListener('input', cargarFrases);
guardarFraseBtn.addEventListener('click', guardarNuevaFrase);

// Eventos del modal de edición
closeButton.addEventListener('click', cerrarModalEdicion);
// Se eliminó el evento window.addEventListener para cerrar al hacer clic fuera

guardarCambiosBtn.addEventListener('click', guardarCambiosEdicion);

// Eventos del nuevo modal de confirmación de eliminación
deleteCloseButton.addEventListener('click', cerrarDeleteConfirmModal);
cancelarEliminarBtn.addEventListener('click', cerrarDeleteConfirmModal);
confirmarEliminarBtn.addEventListener('click', ejecutarEliminacionConfirmada);
// Se eliminó el evento window.addEventListener para cerrar al hacer clic fuera