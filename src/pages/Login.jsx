import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion } from "../services/api";
import "./Login.css";


function Login() {

    const navigate = useNavigate();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");

    const [cargando, setCargando] = useState(false);


    // ==========================================
    // INGRESAR AL SISTEMA
    // ==========================================

    const ingresar = async () => {

        // ==========================================
        // VALIDAR CAMPOS
        // ==========================================

        if (!correo.trim() || !password.trim()) {

            alert("Debe ingresar correo y contraseña.");

            return;

        }


        try {

            setCargando(true);


            // ==========================================
            // ENVIAR DATOS A LA API
            // ==========================================

            const respuesta = await iniciarSesion(
                correo.trim(),
                password
            );


            console.log(
                "Respuesta Login:",
                respuesta
            );


            // ==========================================
            // LOGIN CORRECTO
            // ==========================================

            if (respuesta.success) {

                // Guardar usuario activo

                localStorage.setItem(
                    "usuarioActivo",
                    JSON.stringify(respuesta.usuario)
                );


                // Mostrar bienvenida

                alert(
                    "Bienvenido " +
                    respuesta.usuario.nombre
                );


                // Ir al Dashboard

                navigate("/dashboard");


            } else {

                // ==========================================
                // LOGIN INCORRECTO
                // ==========================================

                alert(
                    respuesta.mensaje ||
                    "Correo o contraseña incorrectos."
                );

            }


        } catch (error) {

            console.error(
                "Error iniciando sesión:",
                error
            );


            alert(
                "No se pudo conectar con el servidor."
            );


        } finally {

            setCargando(false);

        }

    };


    return (

        <div className="login-container">

            <div className="login-card">


                {/* LOGO */}

                <div className="login-logo">

                    📦

                </div>


                {/* TITULO */}

                <h1>

                    Sistema de Gestión
                    <br />
                    de Inventario

                </h1>


                {/* DESCRIPCION */}

                <p>

                    Bienvenido.
                    <br />
                    Inicia sesión para continuar.

                </p>


                {/* CORREO */}

                <label>

                    Correo electrónico

                </label>


                <input
                    type="email"
                    placeholder="Ingrese correo electrónico"
                    value={correo}
                    onChange={(e) =>
                        setCorreo(e.target.value)
                    }
                    onKeyDown={(e) => {

                        if (e.key === "Enter") {

                            ingresar();

                        }

                    }}
                />


                {/* CONTRASEÑA */}

                <label>

                    Contraseña

                </label>


                <input
                    type="password"
                    placeholder="Ingrese contraseña"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    onKeyDown={(e) => {

                        if (e.key === "Enter") {

                            ingresar();

                        }

                    }}
                />


                {/* BOTON */}

                <button
                    onClick={ingresar}
                    disabled={cargando}
                >

                    {cargando
                        ? "Ingresando..."
                        : "Ingresar"
                    }

                </button>


                {/* PIE */}

                <div className="footer-login">

                    © 2026 Sistema de Gestión de Inventario

                </div>


            </div>

        </div>

    );

}


export default Login;