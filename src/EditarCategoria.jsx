
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    obtenerCategorias,
    actualizarCategoria
} from "./services/api";

function EditarCategoria() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [categoria, setCategoria] = useState({
        nombre: "",
        descripcion: ""
    });

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const cargarCategoria = async () => {
            try {
                setCargando(true);
                setError("");

                const datos = await obtenerCategorias();

                const encontrada = datos.find(
                    item => String(item.id) === String(id)
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
        };

        cargarCategoria();
    }, [id]);

    const cambiarDato = (e) => {
        const { name, value } = e.target;

        setCategoria(actual => ({
            ...actual,
            [name]: value
        }));
    };

    const actualizar = async (e) => {
        e.preventDefault();

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
    };

    if (cargando) {
        return <div className="contenedor">Cargando categoría...</div>;
    }

    return (
        <div className="contenedor">
            <h1>✏️ Editar Categoría</h1>

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <form onSubmit={actualizar}>
                <label>Nombre de la categoría</label>

                <input
                    type="text"
                    name="nombre"
                    value={categoria.nombre}
                    onChange={cambiarDato}
                    placeholder="Ingrese el nombre"
                    required
                />

                <label>Descripción</label>

                <textarea
                    name="descripcion"
                    value={categoria.descripcion}
                    onChange={cambiarDato}
                    placeholder="Descripción de la categoría"
                />

                <button type="submit" disabled={guardando}>
                    {guardando
                        ? "Guardando..."
                        : "Actualizar Categoría"}
                </button>
            </form>
        </div>
    );
}

export default EditarCategoria;
