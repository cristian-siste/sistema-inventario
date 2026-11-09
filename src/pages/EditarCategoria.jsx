import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// La API está en src/services, por eso se sube un nivel desde src/pages.
import {
    obtenerCategorias,
    actualizarCategoria
} from "../services/api";

// Formulario para consultar y actualizar una categoría existente.
function EditarCategoria() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Datos que se muestran en el formulario.
    const [categoria, setCategoria] = useState({
        nombre: "",
        descripcion: ""
    });

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    // Normaliza la respuesta de la API, que puede ser una lista directa
    // o un objeto que contiene la lista dentro de "datos".
    function extraerLista(respuesta) {
        if (Array.isArray(respuesta)) {
            return respuesta;
        }

        if (respuesta && Array.isArray(respuesta.datos)) {
            return respuesta.datos;
        }

        return [];
    }

    // Consulta las categorías y busca la que coincide con el ID de la URL.
    useEffect(() => {
        async function cargarCategoria() {
            try {
                setCargando(true);
                setError("");

                const respuesta = await obtenerCategorias();
                const lista = extraerLista(respuesta);

                const encontrada = lista.find(
                    (item) => String(item.id) === String(id)
                );

                if (!encontrada) {
                    setError("No se encontró la categoría seleccionada.");
                    return;
                }

                setCategoria({
                    nombre: encontrada.nombre || "",
                    descripcion: encontrada.descripcion || ""
                });
            } catch (err) {
                console.error("Error cargando categoría:", err);
                setError(
                    err.message || "No se pudo cargar la categoría."
                );
            } finally {
                setCargando(false);
            }
        }

        cargarCategoria();
    }, [id]);

    // Actualiza el estado al escribir en los campos.
    function cambiarDato(evento) {
        const { name, value } = evento.target;

        setCategoria((actual) => ({
            ...actual,
            [name]: value
        }));
    }

    // Valida y envía los cambios a la API PHP.
    async function actualizar(evento) {
        evento.preventDefault();

        if (!categoria.nombre.trim()) {
            setError("Escribe el nombre de la categoría.");
            return;
        }

        try {
            setGuardando(true);
            setError("");

            await actualizarCategoria(id, {
                nombre: categoria.nombre.trim(),
                descripcion: categoria.descripcion.trim()
            });

            alert("Categoría actualizada correctamente.");
            navigate("/categorias");
        } catch (err) {
            console.error("Error actualizando categoría:", err);

            setError(
                err.message || "No se pudo actualizar la categoría."
            );
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <div className="contenedor">
                <p>Cargando categoría...</p>
            </div>
        );
    }

    return (
        <div className="contenedor">
            <h1>✏️ Editar categoría</h1>

            {error && (
                <p role="alert" style={{ color: "#b91c1c" }}>
                    {error}
                </p>
            )}

            <form onSubmit={actualizar}>
                <label htmlFor="nombre">Nombre de la categoría</label>

                <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={categoria.nombre}
                    onChange={cambiarDato}
                    placeholder="Ingrese el nombre"
                    required
                />

                <label htmlFor="descripcion">Descripción</label>

                <textarea
                    id="descripcion"
                    name="descripcion"
                    value={categoria.descripcion}
                    onChange={cambiarDato}
                    placeholder="Descripción de la categoría"
                    rows="4"
                />

                <button type="submit" disabled={guardando}>
                    {guardando
                        ? "Guardando..."
                        : "Actualizar categoría"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/categorias")}
                    disabled={guardando}
                >
                    Cancelar
                </button>
            </form>
        </div>
    );
}

export default EditarCategoria;