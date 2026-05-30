import { Link } from 'react-router-dom'

// 模拟产品数据
const products = [
  { id: 1, name: 'React 实战教程', price: '¥99', description: '从入门到精通' },
  { id: 2, name: 'JavaScript 高级编程', price: '¥129', description: '深入理解 JS' },
  { id: 3, name: '前端工程化实践', price: '¥89', description: '提升开发效率' },
]

function Products() {
  return (
    <div className="page">
      <h2>📦 产品列表</h2>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="price">{product.price}</p>
            <Link to={`/products/${product.id}`} className="btn btn-primary">
              查看详情
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Products