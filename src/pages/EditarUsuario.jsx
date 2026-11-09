
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    obtenerUsuarios,
    actualizarUsuario
} from "../services/api";

function EditarUsuario() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState({
        nombre: "",
        correo: "",
        password: "",
        rol: "Auxiliar"
    });

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        cargarUsuario();
    }, [id]);

    const cargarUsuario = async () => {
        try {
            setCargando(true);
            setError("");

            const usuarios = await obtenerUsuarios();

            if (!Array.isArray(usuarios)) {
                throw new Error("No se pudo obtener la lista de usuarios.");
            }

            const encontrado = usuarios.find(
                item => String(item.id) === String(id)
            );

            if (!encontrado) {
                throw new Error("No se encontró el usuario seleccionado.");
            }

            setUsuario({
                nombre: encontrado.nombre || "",
                correo: encontrado.correo || "",
                password: "",
                rol: encontrado.rol || "Auxiliar"
            });

        } catch (err) {
            console.error("Error cargando usuario:", err);
            setError(err.message || "No se pudo cargar el usuario.");
        } finally {
            setCargando(false);
        }
    };

    const cambiarDato = (e) => {
        setUsuario({
            ...usuario,
            [e.target.name]: e.target.value
        });
    };

    const guardarCambios = async (e) => {
        e.preventDefault();

        try {
            setGuardando(true);
            setError("");

            const datosActualizar = {
                nombre: usuario.nombre.trim(),
                correo: usuario.correo.trim(),
                rol: usuario.rol
            };

            // Solo enviar contraseña si escribiste una nueva.
            if (usuario.password.trim() !== "") {
                datosActualizar.password = usuario.password;
            }

            await actualizarUsuario(id, datosActualizar);

            alert("Usuario actualizado correctamente.");
            navigate("/usuarios");

        } catch (err) {
            console.error("Error actualizando usuario:", err);
            setError(
                err.message || "No se pudo actualizar el usuario."
            );
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="contenedor">
                <h1>Editar Usuario</h1>
                <p>Cargando información del usuario...</p>
            </div>
        );
    }

    return (
        <div className="contenedor">
            <h1>Editar Usuario</h1>

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <form onSubmit={guardarCambios}>
                <label>Nombre</label>
                <input
                    type="text"
                    name="nombre"
                    value={usuario.nombre}
                    onChange={cambiarDato}
                    required
                />

                <label>Correo</label>
                <input
                    type="email"
                    name="correo"
                    value={usuario.correo}
                    onChange={cambiarDato}
                    required
                />

                <label>
                    Nueva contraseña (opcional)
                </label>
                <input
                    type="password"
                    name="password"
                    value={usuario.password}
                    onChange={cambiarDato}
                    placeholder="Déjala vacía para conservar la actual"
                />

                <label>Rol</label>
                <select
                    name="rol"
                    value={usuario.rol}
                    onChange={cambiarDato}
                >
                    <option value="Administrador">
                        Administrador
                    </option>
                    <option value="Auxiliar">
                        Auxiliar
                    </option>
                </select>

                <button type="submit" disabled={guardando}>
                    {guardando ? "Guardando..." : "Actualizar Usuario"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/usuarios")}
                    disabled={guardando}
                >
                    Cancelar
                </button>
            </form>
        </div>
    );
}

export default EditarUsuario;
