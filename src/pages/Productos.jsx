
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { obtenerProductos, eliminarProducto } from "../services/api";
import "./Productos.css";

function Productos() {

    // Almacena la lista de productos.
    const [productos, setProductos] = useState([]);

    // Controla el estado de carga y los errores.
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");


    // =====================================================
    // 1. CONSULTAR LOS PRODUCTOS
    // =====================================================

    const cargarProductos = useCallback(async () => {

        setCargando(true);
        setError("");

        try {

            // Consulta los productos registrados en la API.
            const datos = await obtenerProductos();

            // Comprueba que la API devuelva una lista.
            if (!Array.isArray(datos)) {
                throw new Error(
                    "La API no devolvió una lista válida de productos."
                );
            }

            setProductos(datos);

        } catch (error) {

            console.error("Error cargando productos:", error);

            setError(
                error.message || "No fue posible cargar los productos."
            );

        } finally {

            setCargando(false);
        }

    }, []);


    // =====================================================
    // 2. CARGAR Y ACTUALIZAR LA LISTA
    // =====================================================

    useEffect(() => {

        // Consulta los productos al abrir la página.
        cargarProductos();

        // Escucha cambios realizados desde otros formularios.
        window.addEventListener("datosActualizados", cargarProductos);

        // Retira el evento cuando se abandona la página.
        return () => {
            window.removeEventListener(
                "datosActualizados",
                cargarProductos
            );
        };

    }, [cargarProductos]);


    // =====================================================
    // 3. ELIMINAR UN PRODUCTO
    // =====================================================

    const eliminar = async (id) => {

        // Solicita confirmación antes de eliminar.
        const confirmar = window.confirm(
            "¿Desea eliminar este producto?"
        );

        if (!confirmar) return;

        try {

            await eliminarProducto(id);

            // Actualiza la tabla después de eliminar.
            await cargarProductos();

            window.dispatchEvent(new Event("datosActualizados"));

            window.alert("Producto eliminado correctamente.");

        } catch (error) {

            console.error("Error eliminando producto:", error);

            window.alert(
                error.message || "No fue posible eliminar el producto."
            );
        }
    };


    // =====================================================
    // 4. MOSTRAR LA TABLA DE PRODUCTOS
    // =====================================================

    return (

        <div className="contenedor">

            {/* Encabezado y botón para registrar productos */}
            <div className="header-pagina">

                <h1>Productos</h1>

                <Link to="/nuevo-producto" className="btn">
                    Nuevo Producto
                </Link>

            </div>


            {/* Mensaje cuando ocurre un error */}
            {error && (
                <p role="alert">
                    Error: {error}
                </p>
            )}


            {/* Tabla principal */}
            <div className="tabla-contenedor">

                <table>

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Marca</th>
                            <th>Código</th>
                            <th>Unidad</th>
                            <th>Descripción</th>
                            <th>Precio Compra</th>
                            <th>Precio Venta</th>
                            <th>Stock</th>
                            <th>Categoría</th>
                            <th>Proveedor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>


                    <tbody>

                        {cargando ? (

                            <tr>
                                <td colSpan="12">
                                    Cargando productos...
                                </td>
                            </tr>

                        ) : productos.length === 0 ? (

                            <tr>
                                <td colSpan="12">
                                    No hay productos registrados.
                                </td>
                            </tr>

                        ) : (

                            productos.map((producto) => (

                                <tr key={producto.id}>

                                    <td>{producto.id}</td>

                                    <td>{producto.nombre || "—"}</td>

                                    <td>{producto.marca || "—"}</td>

                                    <td>{producto.codigo_producto || "—"}</td>

                                    <td>{producto.unidad_medida || "Unidad"}</td>

                                    <td>{producto.descripcion || "—"}</td>

                                    <td>
                                        ${Number(producto.precioCompra || 0).toLocaleString("es-CO")}
                                    </td>

                                    <td>
                                        ${Number(producto.precioVenta || 0).toLocaleString("es-CO")}
                                    </td>

                                    <td>{producto.stock}</td>

                                    <td>{producto.categoria || "—"}</td>

                                    <td>{producto.proveedor || "—"}</td>

                                    <td>

                                        {/* Botón para editar */}
                                        <Link
                                            to={`/editar-producto/${producto.id}`}
                                            className="btn-editar"
                                        >
                                            Editar
                                        </Link>

                                        {/* Botón para eliminar */}
                                        <button
                                            className="btn-eliminar"
                                            onClick={() => eliminar(producto.id)}
                                        >
                                            Eliminar
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

export default Productos;
