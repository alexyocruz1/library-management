// pages/admin/create.tsx
import React, { useState, CSSProperties, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { Dropdown, DropdownProps, Button, Segment, Header, Icon, Grid, Form, InputOnChangeData, TextAreaProps } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import Image from 'next/image';

interface Book {
  _id: string;
  code: string;
  title: string;
  author: string;
  editorial: string;
  edition: string;
  categories: string[];
  coverType: string;
  location: string;
  cost: string;
  dateAcquired: string;
  description: string;
  imageUrl?: string;
  copies?: number;
  condition: 'good' | 'regular' | 'bad';
  copiesCount?: number;
}

interface FormData {
  [key: string]: string | number | string[] | undefined;
  invoiceCode: string;
  code: string;
  title: string;
  author: string;
  editorial: string;
  edition: string;
  categories: string[];
  coverType: string;
  location: string;
  cost: string;
  dateAcquired: string;
  description: string;
  imageUrl: string;
  copies?: number;
  condition: 'good' | 'regular' | 'bad';
}

const CreatableSelect = dynamic(
  () => import('react-select/creatable').then((mod) => mod.default),
  { ssr: false }
);

const CreatePage: React.FC = () => {
  const { t } = useTranslation('common');
  const [type, setType] = useState<'book' | 'equipment'>('book');
  const [formData, setFormData] = useState<FormData>({
    invoiceCode: '',
    code: '',
    title: '',
    author: '',
    editorial: '',
    edition: '',
    categories: [],
    coverType: 'soft', // Set a default value
    location: '',
    cost: '',
    dateAcquired: new Date().toISOString().split('T')[0],
    description: '',
    imageUrl: '',
    condition: 'good',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isValidImageUrl, setIsValidImageUrl] = useState<boolean | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isEditableField, setIsEditableField] = useState<{[key: string]: boolean}>({});
  const [costInput, setCostInput] = useState('');

  const selectId = 'category-select';

  useEffect(() => {
    fetchCategories();
    setIsMounted(true);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URI}/api/books/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = (selectedOptions: any) => {
    setSelectedCategories(selectedOptions.map((option: any) => option.value));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.SyntheticEvent<HTMLElement, Event>,
    data?: DropdownProps | InputOnChangeData | TextAreaProps
  ) => {
    const name = (data && 'name' in data) ? data.name as string : (e.target as HTMLInputElement).name;
    const value = (data && 'value' in data) ? data.value : (e.target as HTMLInputElement).value;
    setFormData(prevData => ({ ...prevData, [name]: value as string | number | string[] }));
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setCostInput(value);
      // Update formData with the parsed float value
      setFormData(prev => ({ ...prev, cost: value ? parseFloat(value).toString() : '' }));
    }
  };

  const handleCostBlur = () => {
    // Format the value to always have two decimal places when leaving the field
    if (costInput) {
      const formattedValue = parseFloat(costInput).toFixed(2);
      setCostInput(formattedValue);
      setFormData(prev => ({ ...prev, cost: formattedValue }));
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, imageUrl: url });
    if (url === '') {
      setIsValidImageUrl(null);
      setPreviewImage(null);
    } else if (isValidUrl(url)) {
      setIsValidImageUrl(true);
      setPreviewImage(url);
    } else {
      setIsValidImageUrl(false);
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const requiredFields = ['invoiceCode', 'title', 'author', 'editorial', 'edition', 'categories', 'coverType', 'location', 'cost', 'dateAcquired'];
    const emptyFields = requiredFields.filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      toast.error(t('fillAllRequiredFields'));
      return;
    }

    try {
      const bookData = {
        ...formData,
        categories: selectedCategories,
      };
      console.log('Submitting book data:', bookData);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URI}/api/books`, bookData);
      console.log('API response:', response);
      if (response.status === 201) {
        toast.success(t('bookCreatedSuccess'));
        setFormData({
          invoiceCode: '',
          code: '',
          title: '',
          author: '',
          editorial: '',
          edition: '',
          categories: [],
          coverType: 'soft',
          location: '',
          cost: '',
          dateAcquired: new Date().toISOString().split('T')[0],
          description: '',
          imageUrl: '',
          condition: 'good',
        });
        setSearchTerm('');
        setSearchResults([]);
        setSubmitted(false);
        setSelectedCategories([]);
        setCostInput('');
      }
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error(t('bookCreationError'));
    }
  };

  const handleSearch = async () => {
    setIsSearchMode(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URI}/api/books/search?q=${encodeURIComponent(searchTerm)}`;
      const response = await axios.get(url);
      setSearchResults(response.data.books);
    } catch (error) {
      toast.error(t('errorSearchingBooks'));
    }
  };

  const handleBookSelect = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const book = searchResults.find(book => book._id === data.value);
    if (book) {
      setSelectedBook(book);
      
      const dateAcquired = book.dateAcquired ? new Date(book.dateAcquired).toISOString().split('T')[0] : '';
      const formattedCost = book.cost ? parseFloat(book.cost).toFixed(2) : '';

      setFormData({
        ...formData,
        ...book,
        code: `${book.code}-copy`,
        dateAcquired: dateAcquired,
        imageUrl: book.imageUrl || '',
        copies: book.copies || 0,
        cost: formattedCost,
        coverType: book.coverType || 'soft', // Use the book's cover type or default to 'soft'
        condition: book.condition || 'good', // Use the book's condition or default to 'good'
      });
      setSelectedCategories(book.categories || []);
      setIsSearchMode(true);
      setIsEditableField({
        invoiceCode: true,
        coverType: true,
        location: true,
        cost: true,
        dateAcquired: true,
        condition: true,
        categories: true,
        imageUrl: true,
        title: false,
        author: false,
        editorial: false,
        edition: false,
      });
      setCostInput(formattedCost);
    }
  };

  const handleCopyBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) {
      toast.error(t('noBookSelected'));
      return;
    }

    try {
      console.log('Copying book:', selectedBook._id);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URI}/api/books/${selectedBook._id}/copy`, {
        invoiceCode: formData.invoiceCode,
        coverType: formData.coverType,
        location: formData.location,
        cost: formData.cost,
        dateAcquired: formData.dateAcquired,
        condition: formData.condition,
        categories: selectedCategories,
        imageUrl: formData.imageUrl,
      });
      console.log('API response:', response);
      if (response.status === 201) {
        toast.success(t('bookCopiedSuccess'));
        setSelectedBook({
          ...selectedBook,
          copiesCount: (selectedBook.copiesCount || 0) + 1
        } as Book);
        setSearchResults(prevResults =>
          prevResults.map(book =>
            book._id === selectedBook._id ? { ...book, copiesCount: (book.copiesCount || 0) + 1 } : book
          )
        );
      }
    } catch (error) {
      console.error('Error copying book:', error);
      toast.error(t('bookCopyError'));
    }
  };

  const toggleMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      setFormData({
        invoiceCode: '',
        code: '',
        title: '',
        author: '',
        editorial: '',
        edition: '',
        categories: [],
        coverType: 'soft',
        location: '',
        cost: '',
        dateAcquired: new Date().toISOString().split('T')[0],
        description: '',
        imageUrl: '',
        condition: 'good',
      });
      setSelectedCategories([]);
      setSelectedBook(null);
      setCostInput('');
    } else {
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const isFieldEmpty = (field: string) => submitted && !formData[field];

  const errorStyle: CSSProperties = {
    borderColor: '#e0b4b4',
    backgroundColor: '#fff6f6',
  };

  const renderCopyForm = () => {
    if (!selectedBook) return null;

    return (
      <form className="ui form" onSubmit={handleCopyBook} style={{ marginTop: '2rem' }}>
        <div className="field">
          <label>{t('invoiceCode')}</label>
          <input
            type="text"
            name="invoiceCode"
            value={formData.invoiceCode}
            onChange={handleChange}
            placeholder={t('enterInvoiceCode')}
            style={isFieldEmpty('invoiceCode') ? errorStyle : {}}
          />
        </div>
        <div className="field">
          <label>{t('coverType')}</label>
          <select
            name="coverType"
            value={formData.coverType}
            onChange={handleChange}
            required
          >
            <option value="">{t('selectCoverType')}</option>
            <option value="hard">{t('hardCover')}</option>
            <option value="soft">{t('softCover')}</option>
          </select>
        </div>
        <div className="field">
          <label>{t('location')}</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder={t('enterLocation')}
            style={isFieldEmpty('location') ? errorStyle : {}}
          />
        </div>
        <div className="field">
          <label>{t('cost')}</label>
          <input
            type="text"
            name="cost"
            value={costInput}
            onChange={handleCostChange}
            onBlur={handleCostBlur}
            placeholder={t('enterCost')}
            style={isFieldEmpty('cost') ? errorStyle : {}}
          />
        </div>
        <div className="field">
          <label>{t('dateAcquired')}</label>
          <input
            type="date"
            name="dateAcquired"
            value={formData.dateAcquired}
            onChange={handleChange}
            style={isFieldEmpty('dateAcquired') ? errorStyle : {}}
          />
        </div>
        <div className="field">
          <label>{t('condition')}</label>
          <select
            name="condition"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'good' | 'regular' | 'bad' })}
            style={isFieldEmpty('condition') ? errorStyle : {}}
          >
            <option value="good">{t('good')}</option>
            <option value="regular">{t('regular')}</option>
            <option value="bad">{t('bad')}</option>
          </select>
        </div>
        <div className="field">
          <label>{t('categories')}</label>
          {isMounted && (
            <CreatableSelect
              instanceId={selectId}
              isMulti
              options={categories.map(cat => ({ value: cat, label: cat }))}
              onChange={handleCategoryChange}
              value={selectedCategories.map(cat => ({ value: cat, label: cat }))}
              placeholder={t('selectOrTypeCategories')}
              formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
            />
          )}
        </div>
        <div className="field">
          <label>{t('imageUrl')}</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleImageUrlChange}
            placeholder={t('optionalImageUrl')}
          />
          {isValidImageUrl === false && (
            <div style={{ color: 'red', marginTop: '5px' }}>
              {t('invalidImageUrl')}
            </div>
          )}
          {previewImage && (
            <div style={{ marginTop: '10px' }}>
              <Image src={previewImage} alt="Preview" width={200} height={200} objectFit="contain" />
            </div>
          )}
        </div>
        <button className="ui primary button" type="submit" style={{ marginTop: '1rem' }}>
          {t('copySelectedBook')}
        </button>
      </form>
    );
  };

  return (
    <div>
      <Navbar isLoggedIn={true} />
      <div className="ui container" style={{ margin: '2rem auto', padding: '2rem', maxWidth: '800px' }}>
        <h2>{t('createBook')}</h2>
        
        <Segment>
          <Header as='h3'>
            <Icon name={isSearchMode ? 'search' : 'book'} />
            <Header.Content>
              {isSearchMode ? t('searchExistingBooks') : t('createNewBook')}
            </Header.Content>
          </Header>
          
          <Button onClick={toggleMode} style={{ marginBottom: '1rem' }}>
            {isSearchMode ? t('createNewBook') : t('searchExistingBooks')}
          </Button>

          {isSearchMode ? (
            <>
              <div className="ui fluid action input" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder={t('searchExistingBooks')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button icon='search' onClick={handleSearch} />
              </div>

              {searchResults.length > 0 && (
                <Dropdown
                  placeholder={t('selectBookToCopy')}
                  fluid
                  search
                  selection
                  options={searchResults.map(book => ({
                    key: book._id,
                    text: book.title,
                    value: book._id,
                  }))}
                  onChange={handleBookSelect}
                  style={{ marginBottom: '1rem' }}
                />
              )}

              {renderCopyForm()}
            </>
          ) : (
            <Form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
              <Form.Input
                label={t('invoiceCode')}
                name="invoiceCode"
                value={formData.invoiceCode}
                onChange={handleChange}
                placeholder={t('enterInvoiceCode')}
                error={isFieldEmpty('invoiceCode')}
              />
              {type === 'book' && (
                <>
                  <Form.Input
                    label={t('title')}
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t('enterTitle')}
                    error={isFieldEmpty('title')}
                    disabled={isSearchMode}
                  />
                  <Form.Input
                    label={t('author')}
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder={t('enterAuthor')}
                    error={isFieldEmpty('author')}
                    disabled={isSearchMode}
                  />
                  <Form.Input
                    label={t('editorial')}
                    name="editorial"
                    value={formData.editorial}
                    onChange={handleChange}
                    placeholder={t('enterEditorial')}
                    error={isFieldEmpty('editorial')}
                    disabled={isSearchMode}
                  />

                  <Form.Group widths='equal'>
                    <Form.Input
                      label={t('edition')}
                      name="edition"
                      value={formData.edition}
                      onChange={handleChange}
                      placeholder={t('enterEdition')}
                      error={isFieldEmpty('edition')}
                      disabled={isSearchMode}
                    />
                    <Form.Select
                      fluid
                      label={t('coverType')}
                      name="coverType"
                      options={[
                        { key: 'hard', text: t('hardCover'), value: 'hard' },
                        { key: 'soft', text: t('softCover'), value: 'soft' },
                      ]}
                      placeholder={t('selectCoverType')}
                      value={formData.coverType}
                      onChange={(_, data) => setFormData({ ...formData, coverType: data.value as string })}
                      error={isFieldEmpty('coverType')}
                    />
                    <Form.Select
                      fluid
                      label={t('condition')}
                      name="condition"
                      options={[
                        { key: 'new', text: t('new'), value: 'new' },
                        { key: 'good', text: t('good'), value: 'good' },
                        { key: 'regular', text: t('regular'), value: 'regular' },
                        { key: 'bad', text: t('bad'), value: 'bad' },
                      ]}
                      placeholder={t('selectCondition')}
                      value={formData.condition}
                      onChange={(_, data) => setFormData({ ...formData, condition: data.value as 'good' | 'regular' | 'bad' })}
                      error={isFieldEmpty('condition')}
                    />
                  </Form.Group>

                  <Form.Field>
                    <label>{t('categories')}</label>
                    {isMounted && (
                      <CreatableSelect
                        instanceId={selectId}
                        isMulti
                        options={categories.map(cat => ({ value: cat, label: cat }))}
                        onChange={handleCategoryChange}
                        value={selectedCategories.map(cat => ({ value: cat, label: cat }))}
                        placeholder={t('selectOrTypeCategories')}
                        formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                      />
                    )}
                  </Form.Field>

                  <Form.Group widths='equal'>
                    <Form.Input
                      fluid
                      label={t('location')}
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder={t('enterLocation')}
                      error={isFieldEmpty('location')}
                    />
                    <Form.Input
                      fluid
                      label={t('cost')}
                      name="cost"
                      value={costInput}
                      onChange={handleCostChange}
                      onBlur={handleCostBlur}
                      placeholder={t('enterCost')}
                      error={isFieldEmpty('cost')}
                    />
                  </Form.Group>

                  <Form.Input
                    label={t('dateAcquired')}
                    type="date"
                    name="dateAcquired"
                    value={formData.dateAcquired}
                    onChange={handleChange}
                    error={isFieldEmpty('dateAcquired')}
                  />

                  <Form.Input
                    label={t('imageUrl')}
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder={t('optionalImageUrl')}
                    error={isValidImageUrl === false}
                  />
                  {isValidImageUrl === false && (
                    <div style={{ color: 'red', marginTop: '5px' }}>
                      {t('invalidImageUrl')}
                    </div>
                  )}
                  {previewImage && (
                    <div style={{ marginTop: '10px' }}>
                      <Image src={previewImage} alt="Preview" width={200} height={200} objectFit="contain" />
                    </div>
                  )}
                </>
              )}
              {type === 'equipment' && (
                <Form.TextArea
                  label={t('description')}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              )}
              <Button primary type="submit" style={{ marginTop: '1rem' }} disabled={isSearchMode}>
                {t('submit')}
              </Button>
            </Form>
          )}
        </Segment>
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale as string, ['common'])),
    },
  };
};

export default CreatePage;