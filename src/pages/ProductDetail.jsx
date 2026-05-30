import { useParams, useNavigate, Link } from 'react-router-dom'

// 产品数据（实际项目中应该从API获取）
const productsData = {
  1: { name: 'React 实战教程', price: '¥99', description: '从入门到精通', author: '张三' },
  2: { name: 'JavaScript 高级编程', price: '¥129', description: '深入理解 JS', author: '李四' },
  3: { name: '前端工程化实践', price: '¥89', description: '提升开发效率', author: '王五' }
}

function ProductDetail() {
  const { productId } = useParams() // 获取动态路由参数
  const navigate = useNavigate()
  const product = productsData[productId]

  if (!product) {
    return (
      <div className="page">
        <h2>❌ 产品不存在</h2>
        <Link to="/products" className="btn">返回产品列表</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <h2>📘 {product.name}</h2>
      <div className="product-detail">
        <p><strong>价格：</strong>{product.price}</p>
        <p><strong>作者：</strong>{product.author}</p>
        <p><strong>描述：</strong>{product.description}</p>
      </div>
      <div className="button-group">
        <button onClick={() => navigate(-1)} className="btn">返回上一页</button>
        <Link to="/products" className="btn">返回产品列表</Link>
      </div>
    </div>
  )
}

export default ProductDetail