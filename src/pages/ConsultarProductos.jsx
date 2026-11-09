
import React, { useEffect, useState } from "react";
import { obtenerProductos } from "../services/api";

// Componente para consultar, buscar y revisar el estado de los productos.
function ConsultarProductos() {

    // Estados para almacenar los productos y el texto de búsqueda.
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    // Consulta los productos registrados en la base de datos.
    const cargarProductos = async () => {
        try {
            const datos = await obtenerProductos();

            // Verifica que la respuesta sea una lista antes de guardarla.
            setProductos(Array.isArray(datos) ? datos : []);

        } catch (error) {
            console.error("Error cargando productos:", error);
        }
    };

    // Carga los productos al abrir la pantalla y escucha las actualizaciones.
    useEffect(() => {
        cargarProductos();

        window.addEventListener("datosActualizados", cargarProductos);

        // Retira el evento cuando se abandona la pantalla.
        return () => {
            window.removeEventListener("datosActualizados", cargarProductos);
        };
    }, []);

    // Busca productos por nombre, marca, código o descripción.
    const productosFiltrados = productos.filter((producto) => {
        const texto = busqueda.toLowerCase().trim();

        return (
            (producto.nombre || "").toLowerCase().includes(texto) ||
            (producto.marca || "").toLowerCase().includes(texto) ||
            (producto.codigo_producto || "").toLowerCase().includes(texto) ||
            (producto.descripcion || "").toLowerCase().includes(texto)
        );
    });

    // Determina la disponibilidad según las existencias y el stock mínimo.
    const obtenerEstadoStock = (producto) => {
        const stock = Number(producto.stock || 0);
        const minimo = Number(producto.stockMinimo || 0);

        if (stock === 0) {
            return "Agotado";
        }

        if (stock <= minimo) {
            return "Bajo stock";
        }

        return "Disponible";
    };

    // Da formato a los valores monetarios en pesos colombianos.
    const formatoMoneda = (valor) => {
        return "$" + Number(valor || 0).toLocaleString("es-CO");
    };

    return (
        <div className="contenedor">

            <h1>🔎 Consultar Productos</h1>

            <p>
                Consulte la información, características y disponibilidad
                de los productos registrados en el inventario.
            </p>

            {/* Campo de búsqueda de productos. */}
            <input
                type="text"
                placeholder="Buscar por nombre, marca, código o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />

            {/* Tabla con la información completa de los productos. */}
            <div className="tabla-consultar-productos">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>Marca</th>
                            <th>Código</th>
                            <th>Unidad</th>
                            <th>Descripción</th>
                            <th>Precio Compra</th>
                            <th>Precio Venta</th>
                            <th>Stock</th>
                            <th>Stock Mínimo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>

                    <tbody>
                        {productosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="11">
                                    No se encontraron productos.
                                </td>
                            </tr>
                        ) : (
                            productosFiltrados.map((producto) => (
                                <tr key={producto.id}>
                                    <td>{producto.id}</td>

                                    <td>{producto.nombre}</td>

                                    <td>{producto.marca || "—"}</td>

                                    <td>{producto.codigo_producto || "—"}</td>

                                    <td>{producto.unidad_medida || "Unidad"}</td>

                                    <td>
                                        {producto.descripcion || "Sin descripción"}
                                    </td>

                                    <td>
                                        {formatoMoneda(producto.precioCompra)}
                                    </td>

                                    <td>
                                        {formatoMoneda(producto.precioVenta)}
                                    </td>

                                    <td>{producto.stock || 0}</td>

                                    <td>{producto.stockMinimo || 0}</td>

                                    <td>
                                        {obtenerEstadoStock(producto)}
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

export default ConsultarProductos;
