import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="page not-found">
      <h2>404</h2>
      <h3>页面未找到</h3>
      <p>抱歉，您访问的页面不存在</p>
      <Link to="/" className="btn btn-primary">返回首页</Link>
    </div>
  )
}

export default NotFound