
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Importamos la función que envía los datos del proveedor a PHP.
import { crearProveedor } from "../services/api";

// Importamos los estilos actuales del formulario.
import "./NuevoProveedor.css";

function NuevoProveedor() {

    // Permite navegar a otra página después de guardar.
    const navigate = useNavigate();

    // Estado que almacena toda la información del proveedor.
    const [proveedor, setProveedor] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        correo: "",
        nit: "",
        dias_anticipacion: "3",
        plazo_pago_dias: "30"
    });

    // Controla si el formulario está enviando los datos.
    const [guardando, setGuardando] = useState(false);

    // Almacena los mensajes de error.
    const [error, setError] = useState("");

    // FUNCIÓN: actualizar el estado cuando cambia un campo.
    const cambiarDato = (e) => {

        // Obtenemos el nombre del campo y el valor ingresado.
        const { name, value } = e.target;

        // Actualizamos solamente el campo modificado,
        // conservando los demás datos del proveedor.
        setProveedor((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // FUNCIÓN: validar y guardar el proveedor en la base de datos.
    const guardarProveedor = async (e) => {

        // Evita que el formulario recargue la página.
        e.preventDefault();

        // Limpiamos los errores anteriores.
        setError("");

        // Validamos que el nombre no esté vacío.
        if (!proveedor.nombre.trim()) {
            setError("Ingresa el nombre del proveedor.");
            return;
        }

        // Validamos que el teléfono no esté vacío.
        if (!proveedor.telefono.trim()) {
            setError("Ingresa el teléfono del proveedor.");
            return;
        }

        // Validamos que la dirección no esté vacía.
        if (!proveedor.direccion.trim()) {
            setError("Ingresa la dirección del proveedor.");
            return;
        }

        // Verificamos que los días sean números enteros válidos.
        const anticipacion = Number(proveedor.dias_anticipacion);
        const plazoPago = Number(proveedor.plazo_pago_dias);

        if (
            !Number.isInteger(anticipacion) ||
            anticipacion < 0 ||
            !Number.isInteger(plazoPago) ||
            plazoPago < 0
        ) {
            setError(
                "Los días de anticipación y el plazo de pago deben ser números enteros iguales o mayores a cero."
            );
            return;
        }

        // Validamos el formato del correo si se ha ingresado.
        // El correo es opcional en este formulario.
        const correo = proveedor.correo.trim();

        if (
            correo !== "" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
        ) {
            setError("Ingresa un correo electrónico válido.");
            return;
        }

        try {

            // Activamos el indicador de guardado.
            setGuardando(true);

            // Preparamos los datos que enviaremos a la API PHP.
            const datosProveedor = {
                nombre: proveedor.nombre.trim(),
                telefono: proveedor.telefono.trim(),
                direccion: proveedor.direccion.trim(),
                correo: correo || null,
                nit: proveedor.nit.trim() || null,
                dias_anticipacion: anticipacion,
                plazo_pago_dias: plazoPago
            };

            // Enviamos los datos para registrar el proveedor.
            const respuesta = await crearProveedor(datosProveedor);

            // Si la API informa un error, lo mostramos.
            if (respuesta && respuesta.success === false) {
                throw new Error(
                    respuesta.mensaje ||
                    respuesta.error ||
                    "No se pudo guardar el proveedor."
                );
            }

            // Informamos que el registro se completó.
            alert("Proveedor guardado correctamente.");

            // Regresamos al listado de proveedores.
            navigate("/proveedores");

        } catch (err) {

            // Mostramos el error en la consola para diagnosticarlo.
            console.error("Error guardando proveedor:", err);

            // Presentamos el mensaje al usuario.
            setError(
                err.message ||
                "No se pudo guardar el proveedor. Verifica la conexión con PHP."
            );

        } finally {

            // Liberamos el botón, incluso si ocurrió un error.
            setGuardando(false);
        }
    };

    // INTERFAZ: formulario de registro de proveedores.
    return (
        <div className="contenedor">

            {/* Título principal de la página. */}
            <h1>Nuevo Proveedor</h1>

            {/* Mostramos los errores cuando existan. */}
            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            {/* El evento onSubmit ejecuta la función de guardado. */}
            <form
                className="formulario-proveedor"
                onSubmit={guardarProveedor}
            >

                {/* NOMBRE: razón social o nombre del proveedor. */}
                <label htmlFor="nombre">
                    Nombre del proveedor *
                </label>

                <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={proveedor.nombre}
                    onChange={cambiarDato}
                    placeholder="Ingrese nombre o razón social"
                    maxLength={150}
                    autoComplete="organization"
                    required
                />

                {/* TELÉFONO: dato de contacto del proveedor. */}
                <label htmlFor="telefono">
                    Teléfono *
                </label>

                <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    value={proveedor.telefono}
                    onChange={cambiarDato}
                    placeholder="Ingrese teléfono"
                    maxLength={30}
                    autoComplete="tel"
                    required
                />

                {/* CORREO: canal de contacto para pedidos y notificaciones. */}
                <label htmlFor="correo">
                    Correo electrónico
                </label>

                <input
                    id="correo"
                    type="email"
                    name="correo"
                    value={proveedor.correo}
                    onChange={cambiarDato}
                    placeholder="proveedor@empresa.com"
                    maxLength={150}
                    autoComplete="email"
                />

                {/* DIRECCIÓN: ubicación del proveedor. */}
                <label htmlFor="direccion">
                    Dirección *
                </label>

                <textarea
                    id="direccion"
                    name="direccion"
                    value={proveedor.direccion}
                    onChange={cambiarDato}
                    placeholder="Ingrese dirección y ciudad"
                    maxLength={255}
                    autoComplete="street-address"
                    required
                />

                {/* NIT: identificación tributaria del proveedor. */}
                <label htmlFor="nit">
                    NIT
                </label>

                <input
                    id="nit"
                    type="text"
                    name="nit"
                    value={proveedor.nit}
                    onChange={cambiarDato}
                    placeholder="Ingrese NIT"
                    maxLength={30}
                />

                {/* ANTICIPACIÓN: tiempo previo recomendado
                    para realizar un pedido al proveedor. */}
                <label htmlFor="dias_anticipacion">
                    Días de anticipación *
                </label>

                <input
                    id="dias_anticipacion"
                    type="number"
                    name="dias_anticipacion"
                    min="0"
                    step="1"
                    value={proveedor.dias_anticipacion}
                    onChange={cambiarDato}
                    required
                />

                {/* PLAZO DE PAGO: días acordados para pagar
                    una compra según las condiciones pactadas. */}
                <label htmlFor="plazo_pago_dias">
                    Plazo de pago (días) *
                </label>

                <input
                    id="plazo_pago_dias"
                    type="number"
                    name="plazo_pago_dias"
                    min="0"
                    step="1"
                    value={proveedor.plazo_pago_dias}
                    onChange={cambiarDato}
                    required
                />

                {/* BOTÓN: envía el formulario y evita
                    múltiples envíos mientras se guarda. */}
                <button type="submit" disabled={guardando}>
                    {guardando
                        ? "Guardando..."
                        : "Guardar Proveedor"}
                </button>

                {/* CANCELAR: vuelve al listado sin guardar. */}
                <button
                    type="button"
                    disabled={guardando}
                    onClick={() => navigate("/proveedores")}
                >
                    Cancelar
                </button>

            </form>
        </div>
    );
}

// Exportamos el componente para utilizarlo desde las rutas de React.
export default NuevoProveedor;
