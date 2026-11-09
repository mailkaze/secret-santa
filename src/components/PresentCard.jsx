import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export default function PresentCard({ name, wish }) {
  return (
    <Card sx={{ minWidth: 275, m: '5px 5%', mb: '10px', bgcolor: '#dc004e', color: 'white' }}>
      <CardContent>
        <Typography sx={{ fontSize: 14, color: 'white' }} gutterBottom>
          Le regalas a...
        </Typography>
        <Typography variant="h4" component="h4">
          {name}
        </Typography>
        <Typography variant="body2" component="p">
          Y le gustaría que le regalen...
          <br />
          {wish}
        </Typography>
      </CardContent>
    </Card>
  )
}
