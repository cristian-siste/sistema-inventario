
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Importamos las funciones que permiten consultar y eliminar
// proveedores desde nuestra API desarrollada en PHP.
import {
    obtenerProveedores,
    eliminarProveedor
} from "../services/api";

function Proveedores() {

    // Lista donde almacenaremos los proveedores recibidos de PHP.
    const [proveedores, setProveedores] = useState([]);

    // Indica si la información todavía se está cargando.
    const [cargando, setCargando] = useState(true);

    // Guarda el ID del proveedor que se está eliminando.
    // Permite mostrar "Eliminando..." en el botón correspondiente.
    const [eliminando, setEliminando] = useState(null);

    // Guarda los mensajes de operaciones exitosas.
    const [mensaje, setMensaje] = useState("");

    // Guarda los mensajes de error que se presenten.
    const [error, setError] = useState("");

    // useEffect ejecuta la consulta cuando se abre esta página.
    useEffect(() => {
        cargarProveedores();
    }, []);

    // FUNCIÓN: consultar todos los proveedores en la API.
    const cargarProveedores = async () => {
        try {
            // Activamos el indicador de carga y limpiamos mensajes anteriores.
            setCargando(true);
            setError("");
            setMensaje("");

            // Solicitamos los proveedores al backend PHP.
            const datos = await obtenerProveedores();

            // Verificamos que la respuesta sea una lista válida.
            if (!Array.isArray(datos)) {
                throw new Error(
                    "La API no devolvió una lista válida de proveedores."
                );
            }

            // Guardamos la lista recibida para mostrarla en la tabla.
            setProveedores(datos);

        } catch (err) {
            // Mostramos el error en la consola para facilitar el diagnóstico.
            console.error("Error cargando proveedores:", err);

            // Guardamos el mensaje para mostrarlo en pantalla.
            setError(
                err.message || "No se pudieron cargar los proveedores."
            );

        } finally {
            // Finalizamos la carga, haya ocurrido un error o no.
            setCargando(false);
        }
    };

    // FUNCIÓN: eliminar un proveedor seleccionado.
    const handleEliminar = async (proveedor) => {

        // Solicitamos confirmación antes de eliminar el registro.
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar al proveedor "${proveedor.nombre}"?`
        );

        // Si el usuario cancela, no ejecutamos la eliminación.
        if (!confirmar) {
            return;
        }

        try {
            // Indicamos qué proveedor se está eliminando.
            setEliminando(proveedor.id);

            // Limpiamos los mensajes anteriores.
            setMensaje("");
            setError("");

            // Enviamos la solicitud de eliminación a la API PHP.
            await eliminarProveedor(proveedor.id);

            // Quitamos de la tabla el proveedor eliminado.
            // Comparamos como texto para evitar problemas entre
            // identificadores numéricos y cadenas.
            setProveedores((listaActual) =>
                listaActual.filter(
                    (item) => String(item.id) !== String(proveedor.id)
                )
            );

            // Informamos que la operación fue exitosa.
            setMensaje("Proveedor eliminado correctamente.");

        } catch (err) {
            // Registramos el error para poder revisarlo.
            console.error("Error eliminando proveedor:", err);

            // Mostramos el mensaje de error al usuario.
            setError(
                err.message || "No se pudo eliminar el proveedor."
            );

        } finally {
            // Liberamos el estado del botón de eliminación.
            setEliminando(null);
        }
    };

    // FUNCIÓN: mostrar un texto cuando un dato está vacío.
    const mostrarDato = (valor) => {

        // Si el dato existe, lo mostramos.
        // Si es nulo, indefinido o vacío, mostramos un texto alternativo.
        return valor !== null &&
            valor !== undefined &&
            valor !== ""
            ? valor
            : "No registrado";
    };

    // INTERFAZ: construimos la pantalla de proveedores.
    return (
        <div className="contenedor">

            {/* ENCABEZADO: título y botón para registrar proveedores. */}
            <div className="header-pagina">
                <div>
                    <h1>Gestión de Proveedores</h1>

                    <p>
                        Consulta y administra la información
                        de tus proveedores.
                    </p>
                </div>

                {/* Link lleva al formulario de creación existente. */}
                <Link
                    to="/nuevo-proveedor"
                    className="btn"
                >
                    + Nuevo Proveedor
                </Link>
            </div>

            {/* MENSAJE: se muestra cuando una operación es exitosa. */}
            {mensaje && (
                <p role="status" style={{ color: "green" }}>
                    {mensaje}
                </p>
            )}

            {/* ERROR: se muestra si falla una consulta o eliminación. */}
            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            {/* TABLA: contiene la información de cada proveedor. */}
            <div className="tabla-contenedor">
                <table>

                    {/* ENCABEZADOS: nombre de cada columna. */}
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Correo electrónico</th>
                            <th>Dirección</th>
                            <th>Días anticipación</th>
                            <th>Plazo de pago</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    {/* CUERPO: muestra los registros consultados. */}
                    <tbody>

                        {/* CASO 1: todavía se están consultando datos. */}
                        {cargando ? (
                            <tr>
                                <td colSpan="8">
                                    Cargando proveedores...
                                </td>
                            </tr>

                        /* CASO 2: la consulta no devolvió proveedores. */
                        ) : proveedores.length === 0 ? (
                            <tr>
                                <td colSpan="8">
                                    No hay proveedores registrados.
                                </td>
                            </tr>

                        /* CASO 3: recorremos la lista y creamos una fila
                           por cada proveedor registrado. */
                        ) : (
                            proveedores.map((proveedor) => (
                                <tr key={proveedor.id}>

                                    {/* Identificador único del proveedor. */}
                                    <td>{proveedor.id}</td>

                                    {/* Información básica del proveedor. */}
                                    <td>
                                        {mostrarDato(proveedor.nombre)}
                                    </td>

                                    <td>
                                        {mostrarDato(proveedor.telefono)}
                                    </td>

                                    {/* Correo de contacto del proveedor. */}
                                    <td>
                                        {mostrarDato(proveedor.correo)}
                                    </td>

                                    {/* Dirección registrada. */}
                                    <td>
                                        {mostrarDato(proveedor.direccion)}
                                    </td>

                                    {/* Días de anticipación para realizar pedidos. */}
                                    <td>
                                        {mostrarDato(
                                            proveedor.dias_anticipacion
                                        )}
                                    </td>

                                    {/* Plazo acordado para realizar el pago. */}
                                    <td>
                                        {proveedor.plazo_pago_dias !== null &&
                                        proveedor.plazo_pago_dias !== undefined &&
                                        proveedor.plazo_pago_dias !== ""
                                            ? `${proveedor.plazo_pago_dias} días`
                                            : "No registrado"}
                                    </td>

                                    {/* ACCIONES: editar o eliminar el proveedor. */}
                                    <td>

                                        {/* EDITAR: abre el formulario
                                            del proveedor seleccionado. */}
                                        <Link
                                            to={`/editar-proveedor/${proveedor.id}`}
                                            className="btn-editar"
                                        >
                                            Editar
                                        </Link>

                                        {" "}

                                        {/* ELIMINAR: ejecuta la función
                                            handleEliminar con confirmación. */}
                                        <button
                                            type="button"
                                            className="btn-eliminar"
                                            onClick={() =>
                                                handleEliminar(proveedor)
                                            }
                                            disabled={
                                                String(eliminando) ===
                                                String(proveedor.id)
                                            }
                                        >
                                            {/* Cambia el texto mientras
                                                se procesa la eliminación. */}
                                            {String(eliminando) ===
                                            String(proveedor.id)
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

            {/* ACTUALIZAR: permite volver a consultar la información
                sin recargar manualmente todo el navegador. */}
            <div style={{ marginTop: "16px" }}>
                <button
                    type="button"
                    className="btn"
                    onClick={cargarProveedores}
                    disabled={cargando}
                >
                    {cargando
                        ? "Consultando..."
                        : "Actualizar lista"}
                </button>
            </div>

        </div>
    );
}

// Exportamos el componente para utilizarlo desde App.jsx
// y mostrarlo en la ruta correspondiente.
export default Proveedores;
