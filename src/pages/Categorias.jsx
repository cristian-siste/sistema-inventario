
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    obtenerCategorias,
    eliminarCategoria
} from "../services/api";

function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [eliminando, setEliminando] = useState(null);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            setCargando(true);
            setError("");

            const datos = await obtenerCategorias();

            if (!Array.isArray(datos)) {
                throw new Error(
                    "No se pudo obtener la lista de categorías."
                );
            }

            setCategorias(datos);
        } catch (err) {
            console.error("Error cargando categorías:", err);
            setError(
                err.message || "No se pudieron cargar las categorías."
            );
        } finally {
            setCargando(false);
        }
    };

    const handleEliminar = async (categoria) => {
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setEliminando(categoria.id);
            setError("");
            setMensaje("");

            await eliminarCategoria(categoria.id);

            setCategorias((lista) =>
                lista.filter(
                    (item) =>
                        String(item.id) !== String(categoria.id)
                )
            );

            setMensaje("Categoría eliminada correctamente.");
        } catch (err) {
            console.error("Error eliminando categoría:", err);

            setError(
                err.message ||
                "No se pudo eliminar la categoría. Puede tener productos asociados."
            );
        } finally {
            setEliminando(null);
        }
    };

    return (
        <div className="contenedor">
            <div className="header-pagina">
                <h1>Categorías</h1>

                <Link to="/nueva-categoria" className="btn">
                    Nueva Categoría
                </Link>
            </div>

            {mensaje && (
                <p role="status" style={{ color: "green" }}>
                    {mensaje}
                </p>
            )}

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <div className="tabla-contenedor">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="4">
                                    Cargando categorías...
                                </td>
                            </tr>
                        ) : categorias.length === 0 ? (
                            <tr>
                                <td colSpan="4">
                                    No hay categorías registradas.
                                </td>
                            </tr>
                        ) : (
                            categorias.map((categoria) => (
                                <tr key={categoria.id}>
                                    <td>{categoria.id}</td>
                                    <td>{categoria.nombre}</td>
                                    <td>{categoria.descripcion}</td>

                                    <td>
                                        <Link
                                            to={`/editar-categoria/${categoria.id}`}
                                            className="btn-editar"
                                        >
                                            Editar
                                        </Link>

                                        {" "}

                                        <button
                                            type="button"
                                            className="btn-eliminar"
                                            onClick={() =>
                                                handleEliminar(categoria)
                                            }
                                            disabled={
                                                eliminando === categoria.id
                                            }
                                        >
                                            {eliminando === categoria.id
                                                ? "Eliminando..."
                                                : "Eliminar"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Categorias;
