
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearUsuario } from "../services/api";
import "./NuevoUsuario.css";

function NuevoUsuario() {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState({
        nombre: "",
        correo: "",
        password: "",
        rol: "Auxiliar"
    });

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const cambiarDato = (e) => {
        setUsuario({
            ...usuario,
            [e.target.name]: e.target.value
        });
    };

    const guardarUsuario = async (e) => {
        e.preventDefault();

        try {
            setGuardando(true);
            setError("");

            const respuesta = await crearUsuario({
                nombre: usuario.nombre.trim(),
                correo: usuario.correo.trim(),
                password: usuario.password,
                rol: usuario.rol
            });

            if (respuesta && respuesta.success === false) {
                throw new Error(
                    respuesta.error ||
                    respuesta.mensaje ||
                    "No se pudo registrar el usuario."
                );
            }

            alert("Usuario registrado correctamente.");
            navigate("/usuarios");

        } catch (err) {
            console.error("Error registrando usuario:", err);

            setError(
                err.message ||
                "No se pudo registrar el usuario. Verifica la conexión con el servidor."
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="contenedor">
            <h1>➕ Nuevo Usuario</h1>

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <form
                className="formulario-usuario"
                onSubmit={guardarUsuario}
            >
                <label>Nombre</label>
                <input
                    type="text"
                    name="nombre"
                    value={usuario.nombre}
                    onChange={cambiarDato}
                    placeholder="Ingrese nombre"
                    required
                />

                <label>Correo electrónico</label>
                <input
                    type="email"
                    name="correo"
                    value={usuario.correo}
                    onChange={cambiarDato}
                    placeholder="Ingrese correo"
                    required
                />

                <label>Contraseña</label>
                <input
                    type="password"
                    name="password"
                    value={usuario.password}
                    onChange={cambiarDato}
                    placeholder="Ingrese contraseña"
                    required
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
                    {guardando
                        ? "Guardando..."
                        : "Guardar Usuario"}
                </button>
            </form>
        </div>
    );
}

export default NuevoUsuario;
