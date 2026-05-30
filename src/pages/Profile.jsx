import { useParams } from 'react-router-dom'

function Profile() {
  const { userId } = useParams()

  return (
    <div className="page">
      <h2>👤 用户档案</h2>
      <div className="info-box">
        <p><strong>用户 ID：</strong>{userId}</p>
        <p><strong>用户名：</strong>user_{userId}</p>
        <p><strong>邮箱：</strong>user_{userId}@example.com</p>
        <p><strong>注册时间：</strong>2024-01-01</p>
      </div>
    </div>
  )
}

export default Profile