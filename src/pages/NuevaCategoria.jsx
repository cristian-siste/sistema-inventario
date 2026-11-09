
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NuevaCategoria.css";
import { crearCategoria } from "../services/api";

function NuevaCategoria() {
    const navigate = useNavigate();

    const [categoria, setCategoria] = useState({
        nombre: "",
        descripcion: ""
    });

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const cambiarDato = (e) => {
        const { name, value } = e.target;

        setCategoria(actual => ({
            ...actual,
            [name]: value
        }));
    };

    const guardarCategoria = async (e) => {
        e.preventDefault();

        if (!categoria.nombre.trim()) {
            setError("El nombre de la categoría es obligatorio.");
            return;
        }

        try {
            setGuardando(true);
            setError("");

            await crearCategoria({
                nombre: categoria.nombre.trim(),
                descripcion: categoria.descripcion.trim()
            });

            alert("Categoría guardada correctamente.");
            navigate("/categorias");
        } catch (err) {
            console.error("Error guardando categoría:", err);
            setError(err.message || "No se pudo guardar la categoría.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="contenedor">
            <h1>➕ Nueva Categoría</h1>

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <form
                className="formulario-categoria"
                onSubmit={guardarCategoria}
            >
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
                    placeholder="Ingrese la descripción"
                />

                <button type="submit" disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar Categoría"}
                </button>
            </form>
        </div>
    );
}

export default NuevaCategoria;
