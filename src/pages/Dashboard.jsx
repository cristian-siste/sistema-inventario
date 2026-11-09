import React, { useEffect, useState } from "react";

// Importar el menú lateral y los estilos del Dashboard.
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

// Importar las funciones para consultar la API PHP.
import {
    obtenerReporte,
    obtenerProductos,
    obtenerUsuarios,
    obtenerProveedores,
    obtenerEntradas,
    obtenerSalidas,
    obtenerTotalEntradas,
    obtenerTotalSalidas
} from "../services/api";

function Dashboard() {
    // ============================================
    // ESTADOS DE LA INFORMACIÓN
    // ============================================

    const [productos, setProductos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [entradas, setEntradas] = useState([]);
    const [salidas, setSalidas] = useState([]);

    const [reporte, setReporte] = useState({});
    const [totalValorEntradas, setTotalValorEntradas] = useState(0);
    const [totalValorSalidas, setTotalValorSalidas] = useState(0);
    const [productosMasVendidos, setProductosMasVendidos] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");

    // Indicar cuál de las gráficas interactivas está visible.
    const [graficaActiva, setGraficaActiva] = useState("movimientos");

    // ============================================
    // FUNCIONES PARA FORMATEAR LOS VALORES
    // ============================================

    // Mostrar valores monetarios en pesos colombianos.
    const formatoMoneda = (valor) =>
        "$" + Number(valor || 0).toLocaleString("es-CO", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

    // Mostrar cantidades con formato de miles.
    const formatoCantidad = (cantidad) =>
        Number(cantidad || 0).toLocaleString("es-CO");

    // Obtener el nombre del producto usando los campos habituales de la API.
    const nombreProducto = (movimiento) =>
        movimiento.producto ||
        movimiento.nombre ||
        movimiento.nombreProducto ||
        "Producto sin nombre";

    // Obtener el precio unitario disponible en el movimiento.
    const precioUnitarioEntrada = (entrada) =>
        Number(
            entrada.precioUnitario ??
            entrada.precioCompra ??
            entrada.precio_compra ??
            0
        );

    const precioUnitarioSalida = (salida) =>
        Number(
            salida.precioUnitario ??
            salida.precioVenta ??
            salida.precio_venta ??
            0
        );

    // Calcular el valor de una entrada individual.
    const valorEntrada = (entrada) => {
        if (entrada.valorTotal !== undefined && entrada.valorTotal !== null) {
            return Number(entrada.valorTotal || 0);
        }

        return Number(entrada.cantidad || 0) * precioUnitarioEntrada(entrada);
    };

    // Calcular el valor de una salida individual.
    const valorSalida = (salida) => {
        if (salida.valorTotal !== undefined && salida.valorTotal !== null) {
            return Number(salida.valorTotal || 0);
        }

        return Number(salida.cantidad || 0) * precioUnitarioSalida(salida);
    };

    // ============================================
    // CARGAR INFORMACIÓN DESDE LA API PHP
    // ============================================

    const cargarDatos = async () => {
        setErrorCarga("");

        try {
            // Consultar simultáneamente las secciones del sistema.
            const resultados = await Promise.allSettled([
                obtenerProductos(),
                obtenerUsuarios(),
                obtenerProveedores(),
                obtenerEntradas(),
                obtenerSalidas(),
                obtenerReporte(),
                obtenerTotalEntradas(),
                obtenerTotalSalidas()
            ]);

            // Leer los resultados sin impedir que carguen las otras secciones
            // cuando una consulta individual falla.
            const leerResultado = (indice, valorAlternativo) => {
                const resultado = resultados[indice];

                if (resultado.status === "fulfilled") {
                    return resultado.value;
                }

                console.error("Error consultando datos del Dashboard:", resultado.reason);
                return valorAlternativo;
            };

            const datosProductos = leerResultado(0, []);
            const datosUsuarios = leerResultado(1, []);
            const datosProveedores = leerResultado(2, []);
            const datosEntradas = leerResultado(3, []);
            const datosSalidas = leerResultado(4, []);
            const datosReporte = leerResultado(5, {});
            const valorEntradas = leerResultado(6, 0);
            const valorSalidas = leerResultado(7, 0);

            // Guardar únicamente listas válidas.
            setProductos(Array.isArray(datosProductos) ? datosProductos : []);
            setUsuarios(Array.isArray(datosUsuarios) ? datosUsuarios : []);
            setProveedores(Array.isArray(datosProveedores) ? datosProveedores : []);
            setEntradas(Array.isArray(datosEntradas) ? datosEntradas : []);
            setSalidas(Array.isArray(datosSalidas) ? datosSalidas : []);

            // Guardar el reporte general.
            setReporte(
                datosReporte && typeof datosReporte === "object"
                    ? datosReporte
                    : {}
            );

            // Guardar los totales monetarios enviados por PHP.
            setTotalValorEntradas(Number(valorEntradas || 0));
            setTotalValorSalidas(Number(valorSalidas || 0));

            // Guardar el ranking de productos más vendidos.
            setProductosMasVendidos(
                Array.isArray(datosReporte?.productosMasVendidos)
                    ? datosReporte.productosMasVendidos
                    : []
            );

            // Informar si alguna consulta no pudo completarse.
            const huboErrores = resultados.some(
                resultado => resultado.status === "rejected"
            );

            if (huboErrores) {
                setErrorCarga(
                    "Algunos datos no se pudieron cargar. Verifica la API PHP y la conexión con la base de datos."
                );
            }
        } catch (error) {
            console.error("Error cargando el Dashboard:", error);
            setErrorCarga("No fue posible cargar los datos del Dashboard.");
        } finally {
            setCargando(false);
        }
    };

    // Cargar al abrir el Dashboard y escuchar cambios en otras secciones.
    useEffect(() => {
        cargarDatos();

        window.addEventListener("datosActualizados", cargarDatos);

        return () => {
            window.removeEventListener("datosActualizados", cargarDatos);
        };
    }, []);

    // ============================================
    // CÁLCULOS GENERALES DEL INVENTARIO
    // ============================================

    // Sumar todas las unidades disponibles actualmente.
    const stockTotal = productos.reduce(
        (total, producto) => total + Number(producto.stock || 0),
        0
    );

    // Contar productos con stock igual o inferior al mínimo.
    const cantidadProductosBajoStock = productos.filter(producto =>
        Number(producto.stock || 0) <= Number(producto.stockMinimo ?? 5)
    ).length;


    // Preparar productos en alerta y ordenar los agotados primero.
    const productosEnAlerta = productos
        .filter((producto) => Number(producto.stock || 0) <= Number(producto.stockMinimo ?? 5))
        .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

    // Preparar los productos con mayor existencia para la gráfica.
    const productosPorStock = [...productos]
        .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
        .slice(0, 6);
    const maximoStockGrafica = Math.max(1, ...productosPorStock.map(p => Number(p.stock || 0)));

    // Clasificar los productos para mostrar una distribución visual del inventario.
    const productosAgotados = productos.filter(p => Number(p.stock || 0) === 0).length;
    const productosBajos = productos.filter(p => {
        const stock = Number(p.stock || 0);
        return stock > 0 && stock <= Number(p.stockMinimo ?? 5);
    }).length;
    const productosDisponibles = productos.filter(p => Number(p.stock || 0) > Number(p.stockMinimo ?? 5)).length;
    const totalClasificados = Math.max(1, productos.length);
    const porcentajeAgotados = (productosAgotados / totalClasificados) * 100;
    const porcentajeBajos = (productosBajos / totalClasificados) * 100;
    const porcentajeDisponibles = (productosDisponibles / totalClasificados) * 100;


    // Calcular el valor de cada producto en inventario y sumarlo.
    // Fórmula: stock actual × precio de compra.
    const valorInventario = productos.reduce((total, producto) => {
        const stock = Number(producto.stock || 0);
        const costoUnitario = Number(
            producto.precioCompra ?? producto.precio_compra ?? 0
        );

        return total + stock * costoUnitario;
    }, 0);

    // Sumar las unidades que entraron y salieron.
    const unidadesEntradas = entradas.reduce(
        (total, entrada) => total + Number(entrada.cantidad || 0),
        0
    );

    const unidadesSalidas = salidas.reduce(
        (total, salida) => total + Number(salida.cantidad || 0),
        0
    );


    // Calcular la escala para comparar unidades de entradas y salidas.
    const maximoMovimiento = Math.max(1, unidadesEntradas, unidadesSalidas);

    // Calcular los totales desde el detalle como alternativa al total de PHP.
    const totalCalculadoEntradas = entradas.reduce(
        (total, entrada) => total + valorEntrada(entrada),
        0
    );

    const totalCalculadoSalidas = salidas.reduce(
        (total, salida) => total + valorSalida(salida),
        0
    );

    // Usar el total de PHP cuando es distinto de cero.
    // Si PHP devuelve cero, utilizar la suma de los movimientos detallados.
    const totalEntradasMostrar =
        totalValorEntradas !== 0
            ? totalValorEntradas
            : totalCalculadoEntradas;

    const totalSalidasMostrar =
        totalValorSalidas !== 0
            ? totalValorSalidas
            : totalCalculadoSalidas;

    // Usar el reporte cuando proporciona las cantidades; de lo contrario,
    // sumar las cantidades de los movimientos cargados.
    const cantidadEntradasMostrar =
        reporte.totalEntradas !== undefined &&
        reporte.totalEntradas !== null
            ? Number(reporte.totalEntradas)
            : unidadesEntradas;

    const cantidadSalidasMostrar =
        reporte.totalSalidas !== undefined &&
        reporte.totalSalidas !== null
            ? Number(reporte.totalSalidas)
            : unidadesSalidas;

    // ============================================
    // PRESENTACIÓN DEL DASHBOARD
    // ============================================

    return (
        <div className="layout">

            {/* Menú lateral original del sistema. */}
            <Sidebar />

            <div className="contenedor">

                {/* Encabezado principal. */}
                <div className="dashboard-header">
                    <div>
                        <h1>📊 Dashboard</h1>
                        <p>Resumen general del sistema de inventario</p>
                    </div>

                    <div className="usuario-panel">
                        👤 Administrador
                    </div>
                </div>

                {/* Mostrar advertencias de conexión sin ocultar el Dashboard. */}
                {errorCarga && (
                    <div className="mensaje-vacio" role="alert">
                        {errorCarga}
                    </div>
                )}

                {/* =====================================
                    PRIMERA FILA DE INDICADORES
                ====================================== */}

                <div className="dashboard-tarjetas">

                    <div className="tarjeta tarjeta-azul">
                        <div className="icono">📦</div>
                        <h3>Productos</h3>
                        <h2>
                            {reporte.totalProductos ?? productos.length}
                        </h2>
                        <span>Registrados</span>
                    </div>

                    <div className="tarjeta tarjeta-verde">
                        <div className="icono">👥</div>
                        <h3>Usuarios</h3>
                        <h2>{usuarios.length}</h2>
                        <span>Registrados</span>
                    </div>

                    <div className="tarjeta tarjeta-morada">
                        <div className="icono">🚚</div>
                        <h3>Proveedores</h3>
                        <h2>{proveedores.length}</h2>
                        <span>Registrados</span>
                    </div>

                    <div className="tarjeta tarjeta-roja">
                        <div className="icono">⚠️</div>
                        <h3>Bajo stock</h3>
                        <h2>
                            {reporte.bajoStock ?? cantidadProductosBajoStock}
                        </h2>
                        <span>Productos en alerta</span>
                    </div>

                </div>

                {/* =====================================
                    EXISTENCIAS Y VALORES GENERALES
                ====================================== */}

                <div className="dashboard-tarjetas segunda">

                    {/* Tabla detallada del inventario actual. */}
                    <div className="tarjeta-stock-profesional">

                        <div className="stock-encabezado">
                            <div className="stock-icono">📦</div>

                            <div className="stock-titulo">
                                <h3>Inventario actual</h3>
                                <p>Existencias y valor por producto</p>
                            </div>

                            <div className="stock-total">
                                <span>Total de unidades</span>
                                <strong>{formatoCantidad(stockTotal)}</strong>
                            </div>
                        </div>

                        <div className="stock-tabla-contenedor">
                            <table className="stock-tabla">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Stock actual</th>
                                        <th>Precio de compra</th>
                                        <th>Valor en inventario</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {productos.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="stock-sin-datos">
                                                {cargando
                                                    ? "Cargando productos..."
                                                    : "No hay productos registrados."}
                                            </td>
                                        </tr>
                                    ) : (
                                        productos.map((producto, indice) => {
                                            const stock = Number(producto.stock || 0);
                                            const costo = Number(
                                                producto.precioCompra ??
                                                producto.precio_compra ??
                                                0
                                            );

                                            return (
                                                <tr key={producto.id ?? indice}>
                                                    <td>
                                                        <span className="stock-nombre-producto">
                                                            {producto.nombre || "Producto sin nombre"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {formatoCantidad(stock)}
                                                    </td>

                                                    <td>
                                                        {formatoMoneda(costo)}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {formatoMoneda(stock * costo)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>

                                <tfoot>
                                    <tr>
                                        <td><strong>TOTAL INVENTARIO</strong></td>
                                        <td><strong>{formatoCantidad(stockTotal)}</strong></td>
                                        <td>—</td>
                                        <td><strong>{formatoMoneda(valorInventario)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Resumen de entradas. */}
                    <div className="tarjeta-indicador-profesional tarjeta-entradas">
                        <div className="indicador-encabezado">
                            <div className="indicador-icono">📥</div>
                            <div>
                                <h3>Entradas</h3>
                                <p>Ingreso de productos</p>
                            </div>
                        </div>

                        <div className="indicador-contenido">
                            <strong>{formatoCantidad(cantidadEntradasMostrar)}</strong>
                            <span>Unidades ingresadas</span>
                        </div>

                        <div className="indicador-pie">
                            <span>
                                Valor total: {formatoMoneda(totalEntradasMostrar)}
                            </span>
                        </div>
                    </div>

                    {/* Resumen de salidas. */}
                    <div className="tarjeta-indicador-profesional tarjeta-salidas">
                        <div className="indicador-encabezado">
                            <div className="indicador-icono">📤</div>
                            <div>
                                <h3>Salidas</h3>
                                <p>Salida de productos</p>
                            </div>
                        </div>

                        <div className="indicador-contenido">
                            <strong>{formatoCantidad(cantidadSalidasMostrar)}</strong>
                            <span>Unidades retiradas</span>
                        </div>

                        <div className="indicador-pie">
                            <span>
                                Valor total: {formatoMoneda(totalSalidasMostrar)}
                            </span>
                        </div>
                    </div>

                    {/* Resumen del valor de las existencias. */}
                    <div className="tarjeta-indicador-profesional tarjeta-valor-inventario">
                        <div className="indicador-encabezado">
                            <div className="indicador-icono">💰</div>
                            <div>
                                <h3>Valor del inventario</h3>
                                <p>Existencias actuales</p>
                            </div>
                        </div>

                        <div className="indicador-contenido">
                            <strong>{formatoMoneda(valorInventario)}</strong>
                            <span>Pesos colombianos (COP)</span>
                        </div>

                        <div className="indicador-pie">
                            <span>Stock actual × precio de compra</span>
                        </div>
                    </div>

                </div>

                {/* =====================================
                    GRÁFICAS INTERACTIVAS DEL DASHBOARD
                    Los botones permiten cambiar la visualización sin salir del panel.
                ====================================== */}
                <section className="panel-graficas-interactivas">

                    <div className="grafica-interactiva-encabezado">
                        <div>
                            <h2>📊 Análisis visual del inventario</h2>
                            <p>Selecciona una opción para consultar los indicadores.</p>
                        </div>
                        <span className="grafica-interactiva-etiqueta">
                            Datos del sistema
                        </span>
                    </div>

                    {/* Botones para seleccionar la gráfica que se desea consultar. */}
                    <div
                        className="grafica-interactiva-controles"
                        role="tablist"
                        aria-label="Seleccionar gráfica del Dashboard"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={graficaActiva === "movimientos"}
                            className={
                                graficaActiva === "movimientos"
                                    ? "grafica-interactiva-boton activa"
                                    : "grafica-interactiva-boton"
                            }
                            onClick={() => setGraficaActiva("movimientos")}
                        >
                            Entradas y salidas
                        </button>

                        <button
                            type="button"
                            role="tab"
                            aria-selected={graficaActiva === "estado"}
                            className={
                                graficaActiva === "estado"
                                    ? "grafica-interactiva-boton activa"
                                    : "grafica-interactiva-boton"
                            }
                            onClick={() => setGraficaActiva("estado")}
                        >
                            Estado del inventario
                        </button>

                        <button
                            type="button"
                            role="tab"
                            aria-selected={graficaActiva === "stock"}
                            className={
                                graficaActiva === "stock"
                                    ? "grafica-interactiva-boton activa"
                                    : "grafica-interactiva-boton"
                            }
                            onClick={() => setGraficaActiva("stock")}
                        >
                            Productos con mayor stock
                        </button>
                    </div>

                    {/* Primera gráfica: compara unidades ingresadas y retiradas. */}
                    {graficaActiva === "movimientos" && (
                        <div
                            className="grafica-interactiva-contenido"
                            role="tabpanel"
                        >
                            <div className="grafica-interactiva-resumen">
                                <div className="grafica-resumen-entrada">
                                    <span>Unidades ingresadas</span>
                                    <strong>{formatoCantidad(unidadesEntradas)}</strong>
                                </div>

                                <div className="grafica-resumen-salida">
                                    <span>Unidades retiradas</span>
                                    <strong>{formatoCantidad(unidadesSalidas)}</strong>
                                </div>
                            </div>

                            <div className="grafica-interactiva-barras">
                                <div className="grafica-interactiva-fila">
                                    <div className="grafica-interactiva-leyenda">
                                        <span>Entradas</span>
                                        <strong>{formatoCantidad(unidadesEntradas)}</strong>
                                    </div>

                                    <div className="grafica-interactiva-fondo">
                                        <div
                                            className="grafica-interactiva-barra barra-entrada"
                                            style={{
                                                width: `${(unidadesEntradas / maximoMovimiento) * 100}%`
                                            }}
                                            title={`Entradas: ${formatoCantidad(unidadesEntradas)} unidades`}
                                        />
                                    </div>
                                </div>

                                <div className="grafica-interactiva-fila">
                                    <div className="grafica-interactiva-leyenda">
                                        <span>Salidas</span>
                                        <strong>{formatoCantidad(unidadesSalidas)}</strong>
                                    </div>

                                    <div className="grafica-interactiva-fondo">
                                        <div
                                            className="grafica-interactiva-barra barra-salida"
                                            style={{
                                                width: `${(unidadesSalidas / maximoMovimiento) * 100}%`
                                            }}
                                            title={`Salidas: ${formatoCantidad(unidadesSalidas)} unidades`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="grafica-interactiva-nota">
                                Comparación de las unidades de los movimientos que devuelve actualmente la API.
                            </p>
                        </div>
                    )}

                    {/* Segunda gráfica: muestra el estado de los productos en un anillo. */}
                    {graficaActiva === "estado" && (
                        <div
                            className="grafica-interactiva-contenido grafica-interactiva-distribucion"
                            role="tabpanel"
                        >
                            <div
                                className="grafica-interactiva-anillo"
                                style={{
                                    background: `conic-gradient(
                                        #dc5454 0% ${porcentajeAgotados}%,
                                        #f0b43c ${porcentajeAgotados}% ${porcentajeAgotados + porcentajeBajos}%,
                                        #35a779 ${porcentajeAgotados + porcentajeBajos}% 100%
                                    )`
                                }}
                                role="img"
                                aria-label={`Estado de ${productos.length} productos: ${productosAgotados} agotados, ${productosBajos} con bajo stock y ${productosDisponibles} disponibles`}
                            >
                                <div className="grafica-interactiva-centro">
                                    <strong>{formatoCantidad(productos.length)}</strong>
                                    <span>Productos</span>
                                </div>
                            </div>

                            <div className="grafica-interactiva-lista-estado">
                                <div>
                                    <span className="grafica-punto punto-agotado" />
                                    <span>Agotados</span>
                                    <strong>{formatoCantidad(productosAgotados)}</strong>
                                    <small>{porcentajeAgotados.toFixed(1)}%</small>
                                </div>

                                <div>
                                    <span className="grafica-punto punto-bajo" />
                                    <span>Bajo stock</span>
                                    <strong>{formatoCantidad(productosBajos)}</strong>
                                    <small>{porcentajeBajos.toFixed(1)}%</small>
                                </div>

                                <div>
                                    <span className="grafica-punto punto-disponible" />
                                    <span>Disponibles</span>
                                    <strong>{formatoCantidad(productosDisponibles)}</strong>
                                    <small>{porcentajeDisponibles.toFixed(1)}%</small>
                                </div>

                                <p className="grafica-interactiva-nota">
                                    Se considera agotado el producto con stock cero; bajo stock cuando tiene existencias hasta el mínimo configurado.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tercera gráfica: ordena los productos con más unidades disponibles. */}
                    {graficaActiva === "stock" && (
                        <div
                            className="grafica-interactiva-contenido"
                            role="tabpanel"
                        >
                            {productosPorStock.length === 0 ? (
                                <p className="mensaje-vacio">
                                    No hay productos registrados para mostrar en la gráfica.
                                </p>
                            ) : (
                                <div className="grafica-interactiva-barras">
                                    {productosPorStock.map((producto, indice) => {
                                        const cantidad = Number(producto.stock || 0);

                                        return (
                                            <div
                                                className="grafica-interactiva-fila"
                                                key={producto.id ?? indice}
                                            >
                                                <div className="grafica-interactiva-leyenda">
                                                    <span title={producto.nombre}>
                                                        {producto.nombre || "Producto sin nombre"}
                                                    </span>
                                                    <strong>{formatoCantidad(cantidad)}</strong>
                                                </div>

                                                <div className="grafica-interactiva-fondo">
                                                    <div
                                                        className="grafica-interactiva-barra barra-stock"
                                                        style={{
                                                            width: `${(cantidad / maximoStockGrafica) * 100}%`
                                                        }}
                                                        title={`${producto.nombre || "Producto"}: ${formatoCantidad(cantidad)} unidades`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <p className="grafica-interactiva-nota">
                                Se muestran hasta seis productos, ordenados desde la mayor existencia.
                            </p>
                        </div>
                    )}
                </section>

                {/* =====================================
                    ALERTAS DE INVENTARIO
                    Se conservan los avisos de productos agotados y con bajo stock.
                ====================================== */}
                <div className="panel panel-alertas-inventario">
                    <div className="alertas-encabezado">
                        <div>
                            <h2>⚠️ Alertas de inventario</h2>
                            <p>Productos que requieren revisión o reposición.</p>
                        </div>
                        <strong>{productosEnAlerta.length} productos</strong>
                    </div>

                    <div className="tabla-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Marca</th>
                                    <th>Código</th>
                                    <th>Stock actual</th>
                                    <th>Stock mínimo</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {productosEnAlerta.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">
                                            {cargando
                                                ? "Consultando inventario..."
                                                : "No hay productos con alertas de stock."}
                                        </td>
                                    </tr>
                                ) : (
                                    productosEnAlerta.map((producto, indice) => {
                                        const stock = Number(producto.stock || 0);
                                        const minimo = Number(producto.stockMinimo ?? 5);
                                        const agotado = stock === 0;

                                        return (
                                            <tr key={producto.id ?? indice}>
                                                <td>
                                                    <strong>
                                                        {producto.nombre || "Producto sin nombre"}
                                                    </strong>
                                                </td>
                                                <td>{producto.marca || "—"}</td>
                                                <td>{producto.codigo_producto || "—"}</td>
                                                <td>
                                                    {formatoCantidad(stock)}{" "}
                                                    {producto.unidad_medida || "Unidad"}
                                                </td>
                                                <td>
                                                    {formatoCantidad(minimo)}{" "}
                                                    {producto.unidad_medida || "Unidad"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            agotado
                                                                ? "alerta-estado agotado"
                                                                : "alerta-estado bajo"
                                                        }
                                                    >
                                                        {agotado ? "Agotado" : "Bajo stock"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* =====================================
                    TABLA DETALLADA DE ENTRADAS
                ====================================== */}

                <div className="panel panel-movimientos">
                    <h2>📥 Detalle de entradas</h2>
                    <p className="descripcion-ranking">
                        Cada producto ingresado, su cantidad, costo unitario y valor total.
                    </p>

                    <div className="tabla-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Costo unitario</th>
                                    <th>Valor total</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>

                            <tbody>
                                {entradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            {cargando
                                                ? "Cargando entradas..."
                                                : "No hay entradas registradas."}
                                        </td>
                                    </tr>
                                ) : (
                                    entradas.map((entrada, indice) => (
                                        <tr key={entrada.id ?? indice}>
                                            <td>{nombreProducto(entrada)}</td>
                                            <td>{formatoCantidad(entrada.cantidad)}</td>
                                            <td>{formatoMoneda(precioUnitarioEntrada(entrada))}</td>
                                            <td>
                                                <strong>
                                                    {formatoMoneda(valorEntrada(entrada))}
                                                </strong>
                                            </td>
                                            <td>
                                                {entrada.fecha
                                                    ? String(entrada.fecha).substring(0, 10)
                                                    : "Sin fecha"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            <tfoot>
                                <tr>
                                    <td><strong>TOTAL ENTRADAS</strong></td>
                                    <td><strong>{formatoCantidad(unidadesEntradas)}</strong></td>
                                    <td>—</td>
                                    <td><strong>{formatoMoneda(totalEntradasMostrar)}</strong></td>
                                    <td>—</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* =====================================
                    TABLA DETALLADA DE SALIDAS
                ====================================== */}

                <div className="panel panel-movimientos">
                    <h2>📤 Detalle de salidas</h2>
                    <p className="descripcion-ranking">
                        Cada producto retirado, su cantidad, precio unitario y valor total.
                    </p>

                    <div className="tabla-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio unitario</th>
                                    <th>Valor total</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>

                            <tbody>
                                {salidas.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            {cargando
                                                ? "Cargando salidas..."
                                                : "No hay salidas registradas."}
                                        </td>
                                    </tr>
                                ) : (
                                    salidas.map((salida, indice) => (
                                        <tr key={salida.id ?? indice}>
                                            <td>{nombreProducto(salida)}</td>
                                            <td>{formatoCantidad(salida.cantidad)}</td>
                                            <td>{formatoMoneda(precioUnitarioSalida(salida))}</td>
                                            <td>
                                                <strong>
                                                    {formatoMoneda(valorSalida(salida))}
                                                </strong>
                                            </td>
                                            <td>
                                                {salida.fecha
                                                    ? String(salida.fecha).substring(0, 10)
                                                    : "Sin fecha"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            <tfoot>
                                <tr>
                                    <td><strong>TOTAL SALIDAS</strong></td>
                                    <td><strong>{formatoCantidad(unidadesSalidas)}</strong></td>
                                    <td>—</td>
                                    <td><strong>{formatoMoneda(totalSalidasMostrar)}</strong></td>
                                    <td>—</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* =====================================
                    PRODUCTOS RECIENTES
                ====================================== */}

                <div className="panel">
                    <h2>📦 Productos recientes</h2>

                    <div className="tabla-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Stock</th>
                                    <th>Precio de compra</th>
                                    <th>Precio de venta</th>
                                    <th>Valor actual</th>
                                </tr>
                            </thead>

                            <tbody>
                                {productos.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">No hay productos registrados.</td>
                                    </tr>
                                ) : (
                                    productos.slice(0, 5).map((producto, indice) => {
                                        const stock = Number(producto.stock || 0);
                                        const compra = Number(producto.precioCompra || 0);
                                        const venta = Number(producto.precioVenta || 0);

                                        return (
                                            <tr key={producto.id ?? indice}>
                                                <td>{producto.nombre}</td>
                                                <td>{formatoCantidad(stock)}</td>
                                                <td>{formatoMoneda(compra)}</td>
                                                <td>{formatoMoneda(venta)}</td>
                                                <td>{formatoMoneda(stock * compra)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* =====================================
                    PRODUCTOS MÁS VENDIDOS
                ====================================== */}

                <div className="panel panel-mas-vendidos">
                    <h2>🏆 Productos más vendidos</h2>

                    <p className="descripcion-ranking">
                        Ranking según las unidades registradas en las salidas.
                    </p>

                    {cargando ? (
                        <p className="mensaje-vacio">Cargando reporte...</p>
                    ) : productosMasVendidos.length === 0 ? (
                        <p className="mensaje-vacio">
                            No hay productos con salidas registradas para mostrar.
                        </p>
                    ) : (
                        <div className="tabla-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Posición</th>
                                        <th>Producto</th>
                                        <th>Unidades vendidas</th>
                                        <th>Precio de venta actual</th>
                                        <th>Valor estimado</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {productosMasVendidos.map((producto, indice) => (
                                        <tr
                                            key={
                                                producto.producto_id ??
                                                producto.producto ??
                                                indice
                                            }
                                        >
                                            <td><strong>#{indice + 1}</strong></td>
                                            <td>{nombreProducto(producto)}</td>
                                            <td>
                                                {formatoCantidad(
                                                    producto.unidadesVendidas ??
                                                    producto.cantidad ??
                                                    0
                                                )}
                                            </td>
                                            <td>
                                                {formatoMoneda(
                                                    producto.precioVentaActual ??
                                                    producto.precioVenta ??
                                                    0
                                                )}
                                            </td>
                                            <td>
                                                {formatoMoneda(
                                                    producto.valorEstimado ??
                                                    (
                                                        Number(
                                                            producto.unidadesVendidas ??
                                                            producto.cantidad ??
                                                            0
                                                        ) *
                                                        Number(
                                                            producto.precioVentaActual ??
                                                            producto.precioVenta ??
                                                            0
                                                        )
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* =====================================
                    USUARIOS RECIENTES
                ====================================== */}

                <div className="panel">
                    <h2>👥 Usuarios recientes</h2>

                    <div className="tabla-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Rol</th>
                                </tr>
                            </thead>

                            <tbody>
                                {usuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan="3">No hay usuarios registrados.</td>
                                    </tr>
                                ) : (
                                    usuarios.slice(0, 5).map((usuario, indice) => (
                                        <tr key={usuario.id ?? indice}>
                                            <td>{usuario.nombre}</td>
                                            <td>{usuario.correo}</td>
                                            <td>{usuario.rol}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Dashboard;
