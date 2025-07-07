import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://psujtchqgwthuobvvthv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdWp0Y2hxZ3d0aHVvYnZ2dGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjEwNjIsImV4cCI6MjA2NzE5NzA2Mn0._3U4T28cGy38Y81kB3lGyE4rU9P6fZpzM1QxzyVFhPc';
const supabase = createClient(supabaseUrl, supabaseKey);

const lista = document.getElementById('lista-frases');
const recargarBtn = document.getElementById('recargar');
const filtroNivel = document.getElementById('filtro-nivel');
const buscadorFrase = document.getElementById('buscador-frase');

function getOrdenAleatorio() {
  const opciones = [
    { columna: 'creado_en', asc: false },
    { columna: 'nivel', asc: true },
    { columna: 'frase', asc: true },
    { columna: 'frase', asc: false },
    { columna: 'nivel', asc: false },
    { columna: 'creado_en', asc: true },
  ];
  return opciones[Math.floor(Math.random() * opciones.length)];
}

async function cargarFrases() {
  lista.innerHTML = '<li>Ładowanie...</li>';

  const orden = getOrdenAleatorio();
  const nivelSeleccionado = filtroNivel.value;
  const textoBuscado = buscadorFrase.value.trim().toLowerCase();

  let query = supabase
    .from('frases_polaco')
    .select('frase')
    .order(orden.columna, { ascending: orden.asc })
    .limit(200);

  if (nivelSeleccionado) {
    query = query.eq('nivel', nivelSeleccionado);
  }

  const { data, error } = await query;

  if (error) {
    lista.innerHTML = `<li class="error">Błąd: ${error.message}</li>`;
    return;
  }

  let frasesFiltradas = data;

  if (textoBuscado) {
    frasesFiltradas = data.filter(({ frase }) =>
      frase.toLowerCase().includes(textoBuscado)
    );
  }

  if (frasesFiltradas.length === 0) {
    lista.innerHTML = '<li class="error">Brak pasujących fraz.</li>';
    return;
  }

  lista.innerHTML = '';
  frasesFiltradas.forEach(({ frase }) => {
    const li = document.createElement('li');

    let fraseHTML = frase;
    if (textoBuscado) {
      const regex = new RegExp(`(${textoBuscado})`, 'gi');
      fraseHTML = frase.replace(regex, '<span class="bold">$1</span>');
    }

    li.innerHTML = fraseHTML;
    lista.appendChild(li);
  });
}

// Eventos
window.addEventListener('load', cargarFrases);
recargarBtn.addEventListener('click', cargarFrases);
filtroNivel.addEventListener('change', cargarFrases);
buscadorFrase.addEventListener('input', cargarFrases);
