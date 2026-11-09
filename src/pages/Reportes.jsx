


import React, { useState, useEffect } from "react";
import { obtenerReporte } from "../services/api";
import "./Reportes.css";

function Reportes() {

    // Estadísticas generales y ranking de productos.
    const [reporte, setReporte] = useState({
        totalProductos: 0,
        bajoStock: 0,
        totalEntradas: 0,
        totalSalidas: 0,
        productosMasVendidos: []
    });

    // Estados para controlar la carga y los errores.
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // Consultar los indicadores y el ranking desde la API PHP.
    const cargarReporte = async () => {
        try {
            setError("");

            const datos = await obtenerReporte();

            // Validar la respuesta recibida del servidor.
            if (!datos || datos.success === false) {
                throw new Error(
                    datos?.mensaje || "No se pudo cargar el reporte."
                );
            }

            // Guardar las estadísticas recibidas.
            setReporte({
                totalProductos: Number(datos.totalProductos || 0),
                bajoStock: Number(datos.bajoStock || 0),
                totalEntradas: Number(datos.totalEntradas || 0),
                totalSalidas: Number(datos.totalSalidas || 0),

                // Evitar errores si el ranking no es una lista.
                productosMasVendidos: Array.isArray(
                    datos.productosMasVendidos
                )
                    ? datos.productosMasVendidos
                    : []
            });

        } catch (error) {
            console.error("Error cargando reporte:", error);

            setError(
                "No se pudo cargar el reporte. Verifica la conexión con la API."
            );
        } finally {
            setCargando(false);
        }
    };

    // Cargar información al entrar y escuchar actualizaciones.
    useEffect(() => {
        cargarReporte();

        window.addEventListener(
            "datosActualizados",
            cargarReporte
        );

        // Retirar el evento al salir de la pantalla.
        return () => {
            window.removeEventListener(
                "datosActualizados",
                cargarReporte
            );
        };
    }, []);

    // Formatear valores monetarios en pesos colombianos.
    const formatoMoneda = (valor) => {
        return Number(valor || 0).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        });
    };

    // Calcular la mayor cantidad para dimensionar las barras.
    const mayorCantidad = Math.max(
        1,
        ...reporte.productosMasVendidos.map(
            (producto) => Number(producto.unidadesVendidas || 0)
        )
    );

    return (
        <div className="contenedor reportes-pagina">

            {/* Encabezado del módulo. */}
            <div className="header-pagina">
                <div>
                    <h1>Reportes de inventario</h1>

                    <p>
                        Consulta las existencias y los productos
                        con más salidas del inventario.
                    </p>
                </div>
            </div>

            {/* Mostrar errores y permitir volver a consultar. */}
            {error && (
                <div className="reportes-error" role="alert">
                    <p>{error}</p>

                    <button onClick={cargarReporte}>
                        Reintentar
                    </button>
                </div>
            )}

            {/* Tarjetas con estadísticas generales. */}
            <div className="tarjetas-dashboard">

                <div className="tarjeta">
                    <h3>Total de productos</h3>
                    <p>{reporte.totalProductos}</p>
                </div>

                <div className="tarjeta">
                    <h3>Productos con bajo stock</h3>
                    <p>{reporte.bajoStock}</p>
                </div>

                <div className="tarjeta">
                    <h3>Total de entradas</h3>
                    <p>{reporte.totalEntradas}</p>
                </div>

                <div className="tarjeta">
                    <h3>Total de salidas</h3>
                    <p>{reporte.totalSalidas}</p>
                </div>

            </div>

            {/* Sección del ranking de productos. */}
            <section className="reporte-ranking">

                <div className="reporte-ranking-cabecera">
                    <div>
                        <h2>Productos con más salidas</h2>

                        <p>
                            Ranking por unidades registradas
                            en las salidas.
                        </p>
                    </div>

                    <span className="reporte-ranking-total">
                        Top {reporte.productosMasVendidos.length}
                    </span>
                </div>

                {/* Estado de carga y mensajes del ranking. */}
                {cargando ? (
                    <p className="reporte-mensaje">
                        Cargando información...
                    </p>
                ) : error ? (
                    <p className="reporte-mensaje">
                        No fue posible consultar el ranking.
                    </p>
                ) : reporte.productosMasVendidos.length === 0 ? (
                    <p className="reporte-mensaje">
                        Todavía no hay salidas registradas
                        para mostrar el ranking.
                    </p>
                ) : (
                    <>

                        {/* Barras comparativas por unidades. */}
                        <div className="reporte-barras">

                            {reporte.productosMasVendidos.map(
                                (producto, indice) => {

                                    const cantidad = Number(
                                        producto.unidadesVendidas || 0
                                    );

                                    const porcentaje =
                                        (cantidad / mayorCantidad) * 100;

                                    return (
                                        <div
                                            className="reporte-barra-item"
                                            key={producto.producto_id}
                                        >
                                            <div className="reporte-barra-info">

                                                <span className="reporte-posicion">
                                                    {indice + 1}
                                                </span>

                                                <span className="reporte-producto-nombre">
                                                    {producto.producto || "Sin nombre"}
                                                </span>

                                                <strong>
                                                    {cantidad} unidades
                                                </strong>

                                            </div>

                                            <div className="reporte-barra-fondo">
                                                <div
                                                    className="reporte-barra-valor"
                                                    style={{
                                                        width: `${porcentaje}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                            )}

                        </div>

                        {/* Tabla detallada del ranking. */}
                        <div className="reporte-tabla-contenedor">

                            <table className="reporte-tabla">

                                <thead>
                                    <tr>
                                        <th>Posición</th>
                                        <th>Producto</th>
                                        <th>Marca</th>
                                        <th>Código</th>
                                        <th>Unidad</th>
                                        <th>Unidades de salida</th>
                                        <th>Precio actual</th>
                                        <th>Valor estimado</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {reporte.productosMasVendidos.map(
                                        (producto, indice) => (

                                            <tr key={producto.producto_id}>

                                                <td>{indice + 1}</td>

                                                <td>
                                                    {producto.producto || "Sin nombre"}
                                                </td>

                                                <td>
                                                    {producto.marca || "—"}
                                                </td>

                                                <td>
                                                    {producto.codigo_producto || "—"}
                                                </td>

                                                <td>
                                                    {producto.unidad_medida || "Unidad"}
                                                </td>

                                                <td>
                                                    {Number(
                                                        producto.unidadesVendidas || 0
                                                    )}
                                                </td>

                                                <td>
                                                    {formatoMoneda(
                                                        producto.precioVentaActual
                                                    )}
                                                </td>

                                                <td>
                                                    {formatoMoneda(
                                                        producto.valorEstimado
                                                    )}
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* Aclaración sobre el cálculo de los valores. */}
                        <p className="reporte-nota">
                            El valor estimado se calcula con el precio
                            de venta actual del producto multiplicado
                            por las unidades registradas en las salidas.
                            Las salidas no necesariamente representan
                            ventas comerciales.
                        </p>

                    </>
                )}

            </section>

        </div>
    );
}

export default Reportes;
