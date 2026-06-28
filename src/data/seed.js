// Datos de ejemplo. Solo se usan en modo local (sin Supabase).
export const seed = {
  usuarios: [
    { id: 'u-admin', nombre: 'Ronald', usuario: 'Ronald', pass: '10101987', rol: 'admin', created_at: '2025-01-01' },
    { id: 'u-maestro', nombre: 'Ana Villarreal', usuario: 'anavillarreal', pass: 'maestro123', rol: 'maestro', email: 'ana@colegio.edu', created_at: '2025-01-02' },
    { id: 'u-aprob', nombre: 'Carlos Rivas', usuario: 'crivas', pass: 'aprobar123', rol: 'aprobador', email: 'carlos@colegio.edu', created_at: '2025-01-02' },
    { id: 'u-alumno', nombre: 'Sofía González', usuario: 'sofia', pass: 'alumno123', rol: 'alumno', created_at: '2025-02-05' },
  ],
  representantes: [
    { id: 'r-1', nombre: 'María', apellido: 'González', cedula: 'V-12345678', telefono: '+584141234567', email: 'maria.g@gmail.com', parentesco: 'Madre', created_at: '2025-02-01' },
    { id: 'r-2', nombre: 'Jorge', apellido: 'Pérez', cedula: 'V-23456789', telefono: '+584249876543', email: 'jperez@gmail.com', parentesco: 'Padre', created_at: '2025-02-03' },
  ],
  alumnos: [
    { id: 'a-1', nombre: 'Sofía', apellido: 'González', cedula: 'V-31000111', nivel: 'Primaria', grado: '3er Grado', seccion: 'A', representante_id: 'r-1', usuario_id: 'u-alumno', moroso: false, monto_deuda: 0, created_at: '2025-02-05' },
    { id: 'a-2', nombre: 'Mateo', apellido: 'González', cedula: 'V-31000222', nivel: 'Secundaria', grado: '1er Año', seccion: 'B', representante_id: 'r-1', moroso: true, monto_deuda: 45, created_at: '2025-02-05' },
    { id: 'a-3', nombre: 'Valentina', apellido: 'Pérez', cedula: 'V-31000333', nivel: 'Primaria', grado: '5to Grado', seccion: 'A', representante_id: 'r-2', moroso: true, monto_deuda: 90, created_at: '2025-02-06' },
    { id: 'a-4', nombre: 'Diego', apellido: 'Pérez', cedula: 'V-31000444', nivel: 'Primaria', grado: '3er Grado', seccion: 'A', representante_id: 'r-2', moroso: false, monto_deuda: 0, created_at: '2025-02-07' },
    { id: 'a-5', nombre: 'Camila', apellido: 'Rojas', cedula: 'V-31000555', nivel: 'Primaria', grado: '3er Grado', seccion: 'A', representante_id: '', moroso: false, monto_deuda: 0, created_at: '2025-02-08' },
  ],
  maestros: [
    { id: 'm-1', nombre: 'Ana', apellido: 'Villarreal', cedula: 'V-14000111', telefono: '+584141112233', email: 'ana@colegio.edu', materia: 'Matemática', nivel: 'Primaria', grado: '3er Grado', seccion: 'A', usuario_id: 'u-maestro', created_at: '2025-01-10' },
    { id: 'm-2', nombre: 'Pedro', apellido: 'Salazar', cedula: 'V-15000222', telefono: '+584244455667', email: 'pedro@colegio.edu', materia: 'Lengua', nivel: 'Primaria', grado: '', seccion: '', created_at: '2025-01-12' },
  ],
  personal: [
    { id: 'p-1', nombre: 'Laura', apellido: 'Méndez', cargo: 'Maestro', tipo: 'Docente', telefono: '+584141112233', email: 'laura@colegio.edu', created_at: '2025-01-10' },
    { id: 'p-2', nombre: 'Ana', apellido: 'Torres', cargo: 'Secretaria', tipo: 'Administrativo', telefono: '+584168889900', email: 'ana@colegio.edu', created_at: '2025-01-11' },
    { id: 'p-3', nombre: 'Luis', apellido: 'Brito', cargo: 'Mantenimiento', tipo: 'Obrero', telefono: '+584125556677', email: '', created_at: '2025-01-11' },
  ],
  materias: [
    { id: 'mat-1', nombre: 'Matemática', color: '#2A2F6B', maestro_id: 'm-1', created_at: '2025-01-15' },
    { id: 'mat-2', nombre: 'Lengua y Literatura', color: '#C0392B', maestro_id: 'm-1', created_at: '2025-01-15' },
    { id: 'mat-3', nombre: 'Ciencias Naturales', color: '#2E7D52', maestro_id: 'm-1', created_at: '2025-01-15' },
    { id: 'mat-4', nombre: 'Historia', color: '#C99A2E', maestro_id: 'm-1', created_at: '2025-01-15' },
  ],
  planificaciones: [
    { id: 'pl-1', materia_id: 'mat-1', maestro_id: 'm-1', titulo: 'Fracciones equivalentes', fecha: '2025-07-01', contenido: 'Introducir el concepto de fracción equivalente con material concreto. Actividad práctica en pizarra.', color: '#2A2F6B', aprobador_id: 'u-aprob', status: 'pendiente', correcciones: '', created_at: '2025-06-20' },
    { id: 'pl-2', materia_id: 'mat-2', maestro_id: 'm-1', titulo: 'Análisis de cuento', fecha: '2025-07-03', contenido: 'Lectura comprensiva de un cuento corto y análisis de personajes.', color: '#C0392B', aprobador_id: 'u-aprob', status: 'aprobada', correcciones: '', created_at: '2025-06-18' },
  ],
  items_alumno: [
    { id: 'it-1', alumno_id: 'a-1', categoria: 'calificacion', materia: 'Matemática', titulo: 'Examen unidad 1', valor: '18/20', detalle: '', created_at: '2025-03-01' },
    { id: 'it-2', alumno_id: 'a-1', categoria: 'alergia', materia: '', titulo: 'Penicilina', valor: '', detalle: 'Reacción cutánea. Avisar a enfermería.', created_at: '2025-03-02' },
    { id: 'it-3', alumno_id: 'a-4', categoria: 'nota', materia: '', titulo: 'Comportamiento', valor: '', detalle: 'Muy participativo en clase.', created_at: '2025-03-03' },
  ],
  // Tareas que la maestra asigna a todo el grado/sección. El alumno las ve en su portal.
  tareas: [
    { id: 't-1', materia_id: 'mat-1', maestro_id: 'm-1', grado: '3er Grado', seccion: 'A', titulo: 'Sumas y restas con llevadas', descripcion: 'Resuelve los ejercicios de la página 24. ¡Recuerda revisar tu trabajo al final!', fecha_entrega: '2026-07-03', color: '#2A2F6B', created_at: '2026-06-26' },
    { id: 't-2', materia_id: 'mat-2', maestro_id: 'm-1', grado: '3er Grado', seccion: 'A', titulo: 'Lee un cuento y dibuja', descripcion: 'Lee el cuento "El león y el ratón" y haz un dibujo de tu parte favorita.', fecha_entrega: '2026-07-01', color: '#C0392B', created_at: '2026-06-25' },
    { id: 't-3', materia_id: 'mat-3', maestro_id: 'm-1', grado: '3er Grado', seccion: 'A', titulo: 'Las plantas y sus partes', descripcion: 'Colorea la lámina de la planta y escribe el nombre de cada parte.', fecha_entrega: '2026-06-30', color: '#2E7D52', created_at: '2026-06-24' },
    { id: 't-4', materia_id: 'mat-4', maestro_id: 'm-1', grado: '3er Grado', seccion: 'A', titulo: 'Mi comunidad', descripcion: 'Pregunta a tu familia un cuento sobre el lugar donde vives y compártelo en clase.', fecha_entrega: '2026-07-05', color: '#C99A2E', created_at: '2026-06-27' },
  ],
  // Libros/PDF que usa la maestra, organizados por materia. Se guardan por enlace (URL).
  libros: [
    { id: 'lb-1', materia_id: 'mat-1', maestro_id: 'm-1', grado: '3er Grado', seccion: 'A', titulo: 'Matemática 3° — Libro guía', autor: 'Ministerio de Educación', descripcion: 'Libro base de matemática para tercer grado.', url: 'https://www.education.gouv.fr/sites/default/files/2020-09/exemple-pdf.pdf', color: '#2A2F6B', created_at: '2026-02-10' },
    { id: 'lb-2', materia_id: 'mat-2', maestro_id: 'm-1', grado: '3er Grado', seccion: 'A', titulo: 'Mi libro de Lengua', autor: 'Colección Caracol', descripcion: 'Lecturas y actividades de lengua y literatura.', url: 'https://www.education.gouv.fr/sites/default/files/2020-09/exemple-pdf.pdf', color: '#C0392B', created_at: '2026-02-10' },
    { id: 'lb-3', materia_id: 'mat-3', maestro_id: 'm-1', grado: '3er Grado', seccion: 'A', titulo: 'Ciencias Naturales 3°', autor: 'Editorial Santillana', descripcion: 'Explora la naturaleza que te rodea.', url: 'https://www.education.gouv.fr/sites/default/files/2020-09/exemple-pdf.pdf', color: '#2E7D52', created_at: '2026-02-12' },
  ],
  // Registro de tareas que el alumno marca como hechas (sincroniza su progreso/puntos).
  entregas: [
    { id: 'en-1', alumno_id: 'a-1', tarea_id: 't-3', status: 'entregada', comentario: '', fecha: '2026-06-27', created_at: '2026-06-27' },
  ],
}
