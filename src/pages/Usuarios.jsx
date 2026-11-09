
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    obtenerUsuarios,
    eliminarUsuario
} from "../services/api";

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [eliminando, setEliminando] = useState(null);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            setCargando(true);
            setError("");

            const datos = await obtenerUsuarios();

            if (!Array.isArray(datos)) {
                throw new Error(
                    "La API no devolvió una lista válida de usuarios."
                );
            }

            setUsuarios(datos);
        } catch (err) {
            console.error("Error cargando usuarios:", err);
            setError(err.message || "No se pudieron cargar los usuarios.");
        } finally {
            setCargando(false);
        }
    };

    const handleEliminar = async (usuario) => {
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar al usuario "${usuario.nombre}"?`
        );

        if (!confirmar) return;

        try {
            setEliminando(usuario.id);
            setError("");
            setMensaje("");

            await eliminarUsuario(usuario.id);

            setUsuarios((lista) =>
                lista.filter(
                    (item) => String(item.id) !== String(usuario.id)
                )
            );

            setMensaje("Usuario eliminado correctamente.");
        } catch (err) {
            console.error("Error eliminando usuario:", err);
            setError(
                err.message || "No se pudo eliminar el usuario."
            );
        } finally {
            setEliminando(null);
        }
    };

    return (
        <div className="contenedor">
            <div className="header-pagina">
                <h1>Usuarios</h1>

                <Link to="/nuevo-usuario" className="btn">
                    Nuevo Usuario
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
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="5">Cargando usuarios...</td>
                            </tr>
                        ) : usuarios.length === 0 ? (
                            <tr>
                                <td colSpan="5">
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        ) : (
                            usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.nombre}</td>
                                    <td>{usuario.correo}</td>
                                    <td>{usuario.rol}</td>
                                    <td>
                                        <Link
                                            to={`/editar-usuario/${usuario.id}`}
                                            className="btn-editar"
                                        >
                                            Editar
                                        </Link>{" "}

                                        <button
                                            type="button"
                                            className="btn-eliminar"
                                            onClick={() =>
                                                handleEliminar(usuario)
                                            }
                                            disabled={
                                                eliminando === usuario.id
                                            }
                                        >
                                            {eliminando === usuario.id
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

export default Usuarios;
