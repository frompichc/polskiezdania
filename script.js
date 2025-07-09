import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://psujtchqgwthuobvvthv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdWp0Y2hxZ3d0aHVvYnZ2dGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjEwNjIsImV4cCI6MjA2NzE5NzA2Mn0._3U4T28cGy38Y81kB3lGyE4rU9P6fZpzM1QxzyVFhPc';
const supabase = createClient(supabaseUrl, supabaseKey);

const lista = document.getElementById('lista-frases');
const recargarBtn = document.getElementById('recargar');
const filtroNivel = document.getElementById('filtro-nivel');
const buscadorFrase = document.getElementById('buscador-frase');

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
    .select('frase, nivel')
    .limit(300); // Traemos varias para filtrar aleatoriamente

  if (nivelSeleccionado) {
    query = query.eq('nivel', nivelSeleccionado);
  }

  const { data, error } = await query;

  if (error) {
    lista.innerHTML = `<li class="mensaje-error">Błąd: ${error.message}</li>`;
    return;
  }

  let frasesFiltradas = data;

  // Filtrado por buscador
  if (textoBuscado) {
    frasesFiltradas = frasesFiltradas.filter(({ frase }) =>
      frase.toLowerCase().includes(textoBuscado)
    );
  }

  // Si no hay frases coincidentes
  if (frasesFiltradas.length === 0) {
    lista.innerHTML = '<li class="mensaje-error">Brak pasujących fraz.</li>';
    return;
  }

  // Barajar y mostrar 10 aleatorias
  const frasesAleatorias = frasesFiltradas.sort(() => Math.random() - 0.5).slice(0, 300);

  // Mostrar con numeración y resaltado
  lista.innerHTML = '';
  frasesAleatorias.forEach(({ frase }, index) => {
    const li = document.createElement('li');
    const resaltada = resaltarCoincidencias(frase, textoBuscado);
    li.innerHTML = `<span class="numero"></span> ${resaltada}`;
    lista.appendChild(li);
  });
}

// Eventos
window.addEventListener('load', cargarFrases);
recargarBtn.addEventListener('click', cargarFrases);
filtroNivel.addEventListener('change', cargarFrases);
buscadorFrase.addEventListener('input', cargarFrases);
