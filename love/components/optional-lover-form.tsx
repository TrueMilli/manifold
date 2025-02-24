import { useState } from 'react'
import { set } from 'lodash'
import { updateLover } from 'web/lib/firebase/api'
import { Title } from 'web/components/widgets/title'
import { Col } from 'web/components/layout/col'
import clsx from 'clsx'
import { MultiCheckbox } from 'web/components/multi-checkbox'
import { Row } from 'web/components/layout/row'
import { Input } from 'web/components/widgets/input'
import { ChoicesToggleGroup } from 'web/components/widgets/choices-toggle-group'
import { Button } from 'web/components/buttons/button'
import { colClassName, labelClassName } from 'love/pages/signup'
import { uploadImage } from 'web/lib/firebase/storage'
import { Lover } from 'love/hooks/use-lover'
import { useRouter } from 'next/router'

export const OptionalLoveUserForm = (props: { lover: Lover }) => {
  const { lover } = props
  const { user } = lover

  const [formState, setFormState] = useState({
    ethnicity: lover.ethnicity,
    born_in_location: lover.born_in_location,
    height_in_inches: lover.height_in_inches,
    has_pets: lover.has_pets,
    education_level: lover.education_level,
    photo_urls: lover.photo_urls,
    pinned_url: lover.pinned_url,
    religious_belief_strength: lover.religious_belief_strength,
    religious_beliefs: lover.religious_beliefs,
    political_beliefs: lover.political_beliefs,
  })
  const [heightFeet, setHeightFeet] = useState(0)

  const handleChange = (key: keyof typeof formState, value: any) => {
    setFormState((prevState) => set({ ...prevState }, key, value))
  }
  const router = useRouter()
  const [uploadingImages, setUploadingImages] = useState(false)
  const [filePreviews, setFilePreviews] = useState<string[]>(
    formState.photo_urls ?? []
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploadingImages(true)

    // Convert files to an array and take only the first 6 files
    const selectedFiles = Array.from(files).slice(0, 6)

    // Convert files to URLs for preview
    const fileURLs = selectedFiles.map((file) => URL.createObjectURL(file))

    // Update the state
    setFilePreviews(fileURLs)
    const urls = await Promise.all(
      selectedFiles.map((f) => uploadImage(user.username, f, 'love-images'))
    ).catch((e) => {
      console.error(e)
      return []
    })
    handleChange('photo_urls', urls)
    setUploadingImages(false)
  }

  const handleSubmit = async () => {
    // Do something with the form state, such as sending it to an API
    const res = await updateLover({
      ...formState,
    }).catch((e) => {
      console.error(e)
      return false
    })
    if (res) {
      console.log('success')
      router.push('/love-questions')
    }
  }

  return (
    <>
      <Title>Optional questions</Title>
      <Col className={'gap-8'}>
        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Upload some pics!</label>
          <input
            type="file"
            onChange={handleFileChange}
            multiple // Allows multiple files to be selected
            className={'w-52'}
            disabled={uploadingImages}
          />
          <div className="flex gap-2">
            {filePreviews.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`preview ${index}`}
                className="h-20 w-20 object-cover"
              />
            ))}
          </div>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Political beliefs</label>
          <MultiCheckbox
            choices={{
              Liberal: 'liberal',
              Socialist: 'socialist',
              Libertarian: 'libertarian',
              Moderate: 'moderate',
              Conservative: 'conservative',
              Anarchist: 'anarchist',
              Apolitical: 'apolitical',
              Other: 'other',
            }}
            selected={formState['political_beliefs'] ?? []}
            onChange={(selected) => handleChange('political_beliefs', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Height</label>
          <Row className={'gap-2'}>
            <Col>
              <span>Feet</span>
              <Input
                type="number"
                onChange={(e) => setHeightFeet(Number(e.target.value))}
                className={'w-16'}
              />
            </Col>
            <Col>
              <span>Inches</span>
              <Input
                type="number"
                onChange={(e) =>
                  handleChange(
                    'height_in_inches',
                    Number(e.target.value) + heightFeet * 12
                  )
                }
                className={'w-16'}
              />
            </Col>
          </Row>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Location of birth</label>
          <Input
            type="text"
            onChange={(e) => handleChange('born_in_location', e.target.value)}
            className={'w-52'}
          />
        </Col>
        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Do you have pets?</label>
          <ChoicesToggleGroup
            currentChoice={formState['has_pets'] ?? ''}
            choicesMap={{
              Yes: true,
              No: false,
            }}
            setChoice={(c) => handleChange('has_pets', c)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Ethnicity/origin(s)</label>
          <MultiCheckbox
            choices={{
              African: 'african',
              Asian: 'asian',
              Caucasian: 'caucasian',
              Hispanic: 'hispanic',
              'Middle Eastern': 'middle_eastern',
              'Native American': 'native_american',
              'Pacific Islander': 'pacific_islander',
              Other: 'other',
            }}
            selected={formState['ethnicity'] ?? []}
            onChange={(selected) => handleChange('ethnicity', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            Highest education level
          </label>
          <ChoicesToggleGroup
            currentChoice={formState['education_level'] ?? ''}
            choicesMap={{
              'High School': 'high-school',
              Bachelors: 'bachelors',
              Masters: 'masters',
              Doctorate: 'doctorate',
            }}
            setChoice={(c) => handleChange('education_level', c)}
          />
        </Col>
        <div>
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </Col>
    </>
  )
}
