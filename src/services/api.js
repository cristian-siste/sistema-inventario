
const API = "http://localhost/php-api/api";

// ============================================
// FUNCION GENERAL PARA CONSUMIR LA API
// ============================================

async function solicitarAPI(ruta, opciones = {}) {
    const configuracion = {
        method: opciones.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(opciones.headers || {})
        }
    };

    if (opciones.body !== undefined) {
        configuracion.body = JSON.stringify(opciones.body);
    }

    const respuesta = await fetch(API + "/" + ruta, configuracion);
    const texto = await respuesta.text();

    let datos = null;

    try {
        datos = texto ? JSON.parse(texto) : null;
    } catch (error) {
        console.error("Respuesta no valida del servidor:", texto);
        throw new Error("El servidor no devolvio JSON valido.");
    }

    if (!respuesta.ok) {
        throw new Error(
            (datos && (datos.detalle || datos.error || datos.mensaje)) ||
            ("Error HTTP " + respuesta.status)
        );
    }

    if (
        datos &&
        !Array.isArray(datos) &&
        datos.success === false
    ) {
        throw new Error(
            datos.detalle ||
            datos.error ||
            datos.mensaje ||
            "La operacion no se completo."
        );
    }

    return datos;
}


// ============================================
// PRODUCTOS
// ============================================

export async function obtenerProductos() {
    return solicitarAPI("productos/listar.php");
}

export async function crearProducto(producto) {
    return solicitarAPI("productos/crear.php", {
        method: "POST",
        body: producto
    });
}

export async function actualizarProducto(id, producto) {
    return solicitarAPI("productos/actualizar.php", {
        method: "PUT",
        body: {
            ...producto,
            id: Number(id)
        }
    });
}

export async function eliminarProducto(id) {
    return solicitarAPI("productos/eliminar.php", {
        method: "DELETE",
        body: {
            id: Number(id)
        }
    });
}


// ============================================
// CATEGORIAS
// ============================================

export async function obtenerCategorias() {
    return solicitarAPI("categorias/listar.php");
}

export async function crearCategoria(categoria) {
    return solicitarAPI("categorias/crear.php", {
        method: "POST",
        body: categoria
    });
}

export async function actualizarCategoria(id, categoria) {
    return solicitarAPI("categorias/editar.php", {
        method: "PUT",
        body: {
            ...categoria,
            id: Number(id)
        }
    });
}

export async function eliminarCategoria(id) {
    return solicitarAPI("categorias/eliminar.php", {
        method: "DELETE",
        body: {
            id: Number(id)
        }
    });
}


// ============================================
// PROVEEDORES
// ============================================

export async function obtenerProveedores() {
    return solicitarAPI("proveedores/listar.php");
}

export async function crearProveedor(proveedor) {
    return solicitarAPI("proveedores/crear.php", {
        method: "POST",
        body: proveedor
    });
}

export async function actualizarProveedor(id, proveedor) {
    return solicitarAPI("proveedores/actualizar.php", {
        method: "PUT",
        body: {
            ...proveedor,
            id: Number(id)
        }
    });
}

export async function eliminarProveedor(id) {
    return solicitarAPI("proveedores/eliminar.php", {
        method: "DELETE",
        body: {
            id: Number(id)
        }
    });
}


// ============================================
// USUARIOS
// ============================================

export async function obtenerUsuarios() {
    return solicitarAPI("usuarios/listar.php");
}

export async function crearUsuario(usuario) {
    return solicitarAPI("usuarios/crear.php", {
        method: "POST",
        body: usuario
    });
}

export async function actualizarUsuario(id, usuario) {
    return solicitarAPI("usuarios/editar.php", {
        method: "PUT",
        body: {
            ...usuario,
            id: Number(id)
        }
    });
}

export async function eliminarUsuario(id) {
    return solicitarAPI("usuarios/eliminar.php", {
        method: "DELETE",
        body: {
            id: Number(id)
        }
    });
}


// ============================================
// INICIO DE SESION
// ============================================

export async function iniciarSesion(correo, password) {
    return solicitarAPI("usuarios/login.php", {
        method: "POST",
        body: {
            correo: correo,
            password: password
        }
    });
}


// ============================================
// ENTRADAS
// ============================================

// Consultar las entradas registradas.
export async function obtenerEntradas() {
    const respuesta = await solicitarAPI("entradas/listar.php");

    // Compatibilidad con respuestas antiguas y nuevas de PHP.
    if (Array.isArray(respuesta)) {
        return respuesta;
    }

    return respuesta?.entradas || [];
}

// Obtener el valor total de todas las entradas.
export async function obtenerTotalEntradas() {
    const respuesta = await solicitarAPI("entradas/listar.php");

    return Number(respuesta?.totalGeneral || 0);
}

// Registrar una entrada de productos.
export async function crearEntrada(entrada) {
    return solicitarAPI("entradas/crear.php", {
        method: "POST",
        body: entrada
    });
    

}

// Actualizar una entrada existente y enviar todos sus campos a PHP.
export async function actualizarEntrada(id, entrada) {
    return solicitarAPI("entradas/editar.php", {
        method: "PUT",
        body: {
            // Identificadores y datos principales de la entrada.
            id: Number(id),
            producto_id: Number(entrada.producto_id),
            cantidad: Number(entrada.cantidad),
            fecha: entrada.fecha,

            // Información del comprobante y del proveedor.
            numero_comprobante: entrada.numero_comprobante || "",
            proveedor_id:
                entrada.proveedor_id === "" ||
                entrada.proveedor_id == null
                    ? null
                    : Number(entrada.proveedor_id),

            // El costo puede quedar vacío si no se conoce.
            costo_unitario:
                entrada.costo_unitario === "" ||
                entrada.costo_unitario == null
                    ? null
                    : Number(entrada.costo_unitario),

            // Clasificación y estado de la entrada.
            tipo_entrada: entrada.tipo_entrada,
            estado: entrada.estado,

            // Responsables y observaciones.
            recibido_por: entrada.recibido_por || "",
            usuario: entrada.usuario || "",
            observacion: entrada.observacion || ""
        }
    });
}


// Eliminar una entrada por su ID.
export async function eliminarEntrada(id) {
    return solicitarAPI("entradas/eliminar.php", {
        method: "DELETE",
        body: { id: Number(id) }
    });
}


// ============================================
// SALIDAS
// ============================================

// Obtener el detalle de las salidas y su valor acumulado.
export async function obtenerSalidas() {
    const respuesta = await solicitarAPI("salidas/listar.php");

    // Compatibilidad con respuestas antiguas y nuevas de PHP.
    if (Array.isArray(respuesta)) {
        return respuesta;
    }

    return respuesta?.salidas || [];
}

// Obtener el total monetario de todas las salidas.
export async function obtenerTotalSalidas() {
    const respuesta = await solicitarAPI("salidas/listar.php");

    return Number(respuesta?.totalGeneral || 0);
}

// Registrar una salida de productos.
export async function crearSalida(salida) {
    return solicitarAPI("salidas/crear.php", {
        method: "POST",
        body: salida
    });
}


// ============================================
// REPORTES
// ============================================

// ============================================
// COMPRAS
// ============================================

// Obtener las órdenes de compra y sus detalles desde PHP.
export async function obtenerCompras() {
    return solicitarAPI("compras/listar.php");
}

// Registrar una nueva orden de compra con su proveedor
// y la lista de productos, cantidades y precios.
export async function crearCompra(compra) {
    return solicitarAPI("compras/crear.php", {
        method: "POST",
        body: compra
    });
}

// Registrar la recepción de productos de una compra.
// Envía al backend el ID de la compra y las cantidades recibidas.
export async function recibirCompra(datos) {
    return solicitarAPI("compras/recibir.php", {
        method: "POST",
        body: datos
    });
}

// Registrar desde React las unidades despachadas por el proveedor.
// Esta operación no aumenta el stock del inventario.
export async function despacharCompra(datos) {
    return solicitarAPI("compras/despachar.php", {
        method: "POST",
        body: datos
    });
}


// Consultar los reportes del sistema de inventario.
export async function obtenerReporte() {
    return solicitarAPI("reportes/listar.php");
}