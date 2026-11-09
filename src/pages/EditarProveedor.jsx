
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Importamos las funciones para consultar y actualizar proveedores
// directamente desde la API PHP.
import {
    obtenerProveedores,
    actualizarProveedor
} from "../services/api";

// Importamos los estilos del formulario de proveedores.
// Si este archivo está en otra carpeta, revisa la ruta del CSS.
import "./NuevoProveedor.css";

function EditarProveedor() {

    // Obtenemos el ID del proveedor desde la dirección de la página.
    // Ejemplo: /editar-proveedor/6
    const { id } = useParams();

    // Permite regresar al listado después de actualizar.
    const navigate = useNavigate();

    // Estado que almacena los datos del proveedor.
    const [proveedor, setProveedor] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        correo: "",
        nit: "",
        dias_anticipacion: "3",
        plazo_pago_dias: "30"
    });

    // Controla la carga inicial de los datos.
    const [cargando, setCargando] = useState(true);

    // Controla el envío del formulario.
    const [guardando, setGuardando] = useState(false);

    // Almacena mensajes de error.
    const [error, setError] = useState("");

    // FUNCIÓN: consultar el proveedor que vamos a editar.
    const cargarProveedor = async () => {
        try {
            // Activamos la carga y limpiamos errores anteriores.
            setCargando(true);
            setError("");

            // Consultamos los proveedores guardados en la base de datos.
            const lista = await obtenerProveedores();

            // Comprobamos que la API devuelva una lista válida.
            if (!Array.isArray(lista)) {
                throw new Error(
                    "La API no devolvió una lista válida de proveedores."
                );
            }

            // Buscamos el proveedor correspondiente al ID de la URL.
            const proveedorEncontrado = lista.find(
                (item) => String(item.id) === String(id)
            );

            // Si el proveedor no existe, mostramos un error.
            if (!proveedorEncontrado) {
                throw new Error(
                    "No se encontró el proveedor que deseas editar."
                );
            }

            // Cargamos los datos encontrados en el formulario.
            // Si algún campo está vacío o es NULL, mostramos vacío.
            setProveedor({
                nombre: proveedorEncontrado.nombre ?? "",
                telefono: proveedorEncontrado.telefono ?? "",
                direccion: proveedorEncontrado.direccion ?? "",
                correo: proveedorEncontrado.correo ?? "",
                nit: proveedorEncontrado.nit ?? "",
                dias_anticipacion:
                    proveedorEncontrado.dias_anticipacion ?? "3",
                plazo_pago_dias:
                    proveedorEncontrado.plazo_pago_dias ?? "30"
            });

        } catch (err) {
            // Registramos el error para facilitar su diagnóstico.
            console.error("Error consultando proveedor:", err);

            // Mostramos el mensaje en pantalla.
            setError(
                err.message || "No se pudo consultar el proveedor."
            );

        } finally {
            // Finalizamos el estado de carga.
            setCargando(false);
        }
    };

    // useEffect consulta los datos cuando se abre la pantalla
    // o cuando cambia el ID del proveedor.
    useEffect(() => {
        cargarProveedor();
    }, [id]);

    // FUNCIÓN: actualizar el estado cuando el usuario
    // modifica cualquiera de los campos del formulario.
    const cambiarDato = (e) => {
        const { name, value } = e.target;

        // Conservamos los demás campos y actualizamos el seleccionado.
        setProveedor((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // FUNCIÓN: validar y enviar los cambios a PHP.
    const guardarCambios = async (e) => {

        // Evitamos la recarga automática del formulario.
        e.preventDefault();

        // Limpiamos el error anterior.
        setError("");

        // Validamos el nombre del proveedor.
        if (!proveedor.nombre.trim()) {
            setError("Ingresa el nombre del proveedor.");
            return;
        }

        // Validamos el teléfono.
        if (!proveedor.telefono.trim()) {
            setError("Ingresa el teléfono del proveedor.");
            return;
        }

        // Validamos la dirección.
        if (!proveedor.direccion.trim()) {
            setError("Ingresa la dirección del proveedor.");
            return;
        }

        // Convertimos los plazos a números para validarlos.
        const anticipacion = Number(proveedor.dias_anticipacion);
        const plazoPago = Number(proveedor.plazo_pago_dias);

        // Comprobamos que sean enteros válidos y no negativos.
        if (
            !Number.isInteger(anticipacion) ||
            anticipacion < 0 ||
            !Number.isInteger(plazoPago) ||
            plazoPago < 0
        ) {
            setError(
                "Los días deben ser números enteros iguales o mayores a cero."
            );
            return;
        }

        // Limpiamos los espacios del correo.
        const correo = proveedor.correo.trim();

        // Validamos el correo solo si se ha ingresado.
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

            // Preparamos todos los campos que se enviarán a PHP.
            const datosActualizados = {
                nombre: proveedor.nombre.trim(),
                telefono: proveedor.telefono.trim(),
                direccion: proveedor.direccion.trim(),
                correo: correo || null,
                nit: proveedor.nit.trim() || null,
                dias_anticipacion: anticipacion,
                plazo_pago_dias: plazoPago
            };

            // Enviamos el ID y los nuevos datos a la API.
            // PHP debe recibirlos y ejecutar el UPDATE correspondiente.
            const respuesta = await actualizarProveedor(
                id,
                datosActualizados
            );

            // Si la API devuelve un resultado de error,
            // detenemos el proceso y mostramos el mensaje.
            if (respuesta && respuesta.success === false) {
                throw new Error(
                    respuesta.mensaje ||
                    respuesta.error ||
                    "No se pudo actualizar el proveedor."
                );
            }

            // Informamos que la actualización terminó.
            alert("Proveedor actualizado correctamente.");

            // Regresamos al listado de proveedores.
            navigate("/proveedores");

        } catch (err) {
            // Mostramos el error para poder identificar el problema.
            console.error("Error actualizando proveedor:", err);

            setError(
                err.message ||
                "No se pudo actualizar el proveedor. Verifica la API PHP."
            );

        } finally {
            // Habilitamos nuevamente el formulario.
            setGuardando(false);
        }
    };

    // INTERFAZ: pantalla de edición del proveedor.
    return (
        <div className="contenedor">

            {/* Título de la página. */}
            <h1>Editar Proveedor</h1>

            {/* Mientras consultamos, mostramos un aviso. */}
            {cargando ? (
                <p>Cargando información del proveedor...</p>
            ) : error && !proveedor.nombre ? (

                // Si no se encontró el proveedor o falló la consulta,
                // evitamos mostrar un formulario sin datos.
                <div>
                    <p role="alert" style={{ color: "red" }}>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/proveedores")}
                    >
                        Volver a proveedores
                    </button>
                </div>

            ) : (

                /* FORMULARIO: permite editar los datos del proveedor. */
                <form
                    className="formulario-proveedor"
                    onSubmit={guardarCambios}
                >

                    {/* Mensaje de error durante la edición. */}
                    {error && (
                        <p role="alert" style={{ color: "red" }}>
                            {error}
                        </p>
                    )}

                    {/* NOMBRE DEL PROVEEDOR */}
                    <label htmlFor="nombre">
                        Nombre del proveedor *
                    </label>

                    <input
                        id="nombre"
                        type="text"
                        name="nombre"
                        value={proveedor.nombre}
                        onChange={cambiarDato}
                        maxLength={150}
                        required
                    />

                    {/* TELÉFONO DE CONTACTO */}
                    <label htmlFor="telefono">
                        Teléfono *
                    </label>

                    <input
                        id="telefono"
                        type="tel"
                        name="telefono"
                        value={proveedor.telefono}
                        onChange={cambiarDato}
                        maxLength={30}
                        required
                    />

                    {/* CORREO ELECTRÓNICO */}
                    <label htmlFor="correo">
                        Correo electrónico
                    </label>

                    <input
                        id="correo"
                        type="email"
                        name="correo"
                        value={proveedor.correo}
                        onChange={cambiarDato}
                        maxLength={150}
                        placeholder="proveedor@empresa.com"
                    />

                    {/* DIRECCIÓN DEL PROVEEDOR */}
                    <label htmlFor="direccion">
                        Dirección *
                    </label>

                    <textarea
                        id="direccion"
                        name="direccion"
                        value={proveedor.direccion}
                        onChange={cambiarDato}
                        maxLength={255}
                        required
                    />

                    {/* NIT DEL PROVEEDOR */}
                    <label htmlFor="nit">
                        NIT
                    </label>

                    <input
                        id="nit"
                        type="text"
                        name="nit"
                        value={proveedor.nit}
                        onChange={cambiarDato}
                        maxLength={30}
                        placeholder="Ingrese NIT"
                    />

                    {/* ANTICIPACIÓN PARA REALIZAR PEDIDOS */}
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

                    {/* PLAZO ACORDADO PARA EL PAGO */}
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

                    {/* BOTÓN PARA GUARDAR LOS CAMBIOS */}
                    <button
                        type="submit"
                        disabled={guardando}
                    >
                        {guardando
                            ? "Actualizando..."
                            : "Actualizar Proveedor"}
                    </button>

                    {/* BOTÓN PARA CANCELAR LA EDICIÓN */}
                    <button
                        type="button"
                        disabled={guardando}
                        onClick={() => navigate("/proveedores")}
                    >
                        Cancelar
                    </button>

                </form>
            )}
        </div>
    );
}

// Exportamos el componente para utilizarlo desde App.jsx.
export default EditarProveedor;
