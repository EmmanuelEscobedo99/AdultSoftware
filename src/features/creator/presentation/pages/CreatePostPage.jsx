import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Label, FieldError } from '@/components/ui/Label'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { POST_VISIBILITY } from '@/lib/constants'
import { createPostSchema } from '../../domain/content.schema'
import { creatorContentService } from '../../application/creatorContent.service'
import { useAuth } from '@/features/auth/application/AuthProvider'
import { ImagePlus, X } from 'lucide-react'

export default function CreatePostPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      description: '',
      visibility: POST_VISIBILITY.SUBSCRIBERS,
      price: '',
      publish: true,
    },
  })

  const visibility = watch('visibility')

  const onFilesChange = (event) => {
    setFiles(Array.from(event.target.files ?? []))
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (values) => {
    setSaving(true)
    setError(null)
    try {
      const post = await creatorContentService.createPostWithMedia(values, files, user.id)
      navigate(`/dashboard/creator/content`, { replace: true })
      return post
    } catch (err) {
      setError(err.message ?? 'No se pudo crear el post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-100">Nuevo post</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Sube contenido y elige su visibilidad.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input id="title" error={errors.title} {...register('title')} />
              <FieldError message={errors.title?.message} />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={4}
                error={errors.description}
                {...register('description')}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div>
              <Label>Visibilidad</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: POST_VISIBILITY.FREE, label: 'Libre' },
                  { value: POST_VISIBILITY.SUBSCRIBERS, label: 'Suscriptores' },
                  { value: POST_VISIBILITY.PPV, label: 'PPV' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center justify-center rounded-lg border border-line bg-surface-3 px-2 py-2 text-sm text-neutral-200 has-checked:border-primary has-checked:text-primary"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      className="sr-only"
                      {...register('visibility')}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <FieldError message={errors.visibility?.message} />
            </div>

            {visibility === POST_VISIBILITY.PPV ? (
              <div>
                <Label htmlFor="price">Precio (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="9.99"
                  error={errors.price}
                  {...register('price')}
                />
                <FieldError message={errors.price?.message} />
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archivos</CardTitle>
            <CardDescription>
              Imágenes (máx 10 MB) y videos (máx 500 MB). Hasta 20 archivos.
            </CardDescription>
          </CardHeader>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-3 px-4 py-8 text-sm text-neutral-400 hover:border-primary">
            <ImagePlus className="h-6 w-6" />
            <span>Haz clic para seleccionar archivos</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={onFilesChange}
            />
          </label>

          {files.length ? (
            <ul className="mt-4 space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-surface-3 px-3 py-2 text-sm"
                >
                  <span className="truncate text-neutral-300">
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-3 text-neutral-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard/creator/content')}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Publicar post
          </Button>
        </div>
      </form>
    </div>
  )
}
